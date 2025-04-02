import path from 'node:path'
import fs from 'fs-extra'
import fg from 'fast-glob'
import { dedupeCopyFiles } from './locateCdnNpmInfo.js'
import { installPackageTemporary } from '../vite-plugins/installPackageTemporary.js'
import { babelReplaceImportPathWithCertainFileName } from './replaceImportPath.mjs'

const logger = console

const defaultCopyConfig = {
  '@opentiny/vue-theme': {
    filePathInPackage: '/'
  },
  '@opentiny/vue-renderless': {
    filePathInPackage: '/'
  },
  '@opentiny/vue-runtime': {
    filePathInPackage: '/dist3/'
  },
  '@vue/devtools-api': {
    filePathInPackage: '/'
  }
}

/**
 * 对文件内容进行转换处理
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @returns {string} - 处理后的内容
 */
function transform(content, filename) {
  if (filename.endsWith('.js')) {
    const result = babelReplaceImportPathWithCertainFileName(content, filename, console)
    return result.code || content
  }
  return content
}

/**
 * 从importMapUrl字符串中提取包名、版本和文件路径
 * @param {string} str - 导入字符串
 * @returns {Object} - 提取的信息对象
 * @returns {string} packageName - 包名
 * @returns {string} version - 版本
 * @returns {string} filePathInPackage - 包内文件路径
 * */
function extractInfo(str) {
  try {
    let [packageName, versionAndPath] = str.split('${versionDelimiter}')
    packageName = packageName.replace(/^\$\{VITE_CDN_DOMAIN\}\//, '')
    const [version, filePath] = versionAndPath.split('${fileDelimiter}')

    return {
      packageName,
      version,
      filePathInPackage: filePath || '/'
    }
  } catch (error) {
    logger.error(`[local-cdn-plugin]: Failed to extract info from ${str} 提取 importMap 信息失败`, error)
  }
}

/**
 * 创建环境变量替换插件
 * @param {string} cdnDir - 本地CDN目录名
 * @returns {Object} - Vite插件对象
 */
function createEnvReplacementPlugin(cdnDir, base) {
  return {
    name: 'vite-replace-cdn-env',
    config(config) {
      // 在构建时替换环境变量，将CDN域名替换为本地路径
      if (!config.define) {
        config.define = {}
      }

      config.define['import.meta.env.VITE_CDN_DOMAIN'] = JSON.stringify(
        `${base.endsWith('/') ? base : base + '/'}${cdnDir}`
      )
      // 使用本地 CDN 时，强制设置CDN类型为 local
      config.define['import.meta.env.VITE_CDN_TYPE'] = JSON.stringify('local')
    }
  }
}

/**
 * 复制文件或目录到目标路径
 * @param {string} srcPath - 源文件/目录路径
 * @param {string[]} destPaths - 目标路径数组
 * @param {Set} copiedFiles - 已复制文件集合
 * @param {string} outDir - 输出目录
 */
async function copyFileOrDirectory(srcPath, destPaths, copiedFiles, outDir) {
  // 生成一个唯一标识，避免重复复制相同文件
  const copyId = `${srcPath}:${destPaths.join(',')}`

  if (copiedFiles.has(copyId)) {
    logger.log(`[vite-cdn-copy-plugin]: Skipping already copied file: ${srcPath}`)
    return
  }

  copiedFiles.add(copyId)

  // 检查源文件是否存在
  if (!fs.existsSync(srcPath)) {
    logger.warn(`[vite-cdn-copy-plugin]: Source does not exist: ${srcPath}`)
    return
  }

  const isDirectory = fs.statSync(srcPath).isDirectory()

  // 为每个目标路径执行复制
  for (const destPath of destPaths) {
    const fullDestPath = path.resolve(outDir, destPath)

    try {
      // 确保目标目录存在
      await fs.ensureDir(path.dirname(fullDestPath))

      logger.log(`[vite-cdn-copy-plugin]: Copying from ${srcPath} to ${fullDestPath}`)

      if (isDirectory) {
        // 如果是目录，使用 fast-glob 遍历所有文件并处理
        logger.log(`[vite-cdn-copy-plugin]: Copying directory recursively: ${srcPath} -> ${fullDestPath}`)

        // 确保目标路径存在
        await fs.ensureDir(fullDestPath)

        // 使用绝对路径
        const absoluteSrcPath = path.resolve(process.cwd(), srcPath)

        // 使用 fast-glob 查找所有文件
        const files = fg.sync(`${absoluteSrcPath}/**/*`, { onlyFiles: true })

        // 处理每个文件
        for (const file of files) {
          const relativePath = path.relative(absoluteSrcPath, file)
          const destFilePath = path.join(fullDestPath, relativePath)

          // 确保目标文件的目录存在
          await fs.ensureDir(path.dirname(destFilePath))

          // 读取文件内容
          const content = await fs.readFile(file, 'utf-8')

          // 应用转换
          const transformedContent = transform(content, file)

          // 写入转换后的内容
          await fs.writeFile(destFilePath, transformedContent)
        }
      } else {
        // 如果是单个文件
        logger.log(`[vite-cdn-copy-plugin]: Copying file: ${srcPath} -> ${fullDestPath}`)

        let finalDestPath = path.join(fullDestPath, path.basename(srcPath))

        // 确保目标文件的目录存在
        await fs.ensureDir(path.dirname(finalDestPath))

        // 读取文件内容
        const content = await fs.readFile(srcPath, 'utf-8')

        // 应用转换
        const transformedContent = transform(content, srcPath)

        // 写入转换后的内容
        await fs.writeFile(finalDestPath, transformedContent)
      }

      logger.log(`[vite-cdn-copy-plugin]: Successfully copied: ${srcPath} -> ${fullDestPath}`)
    } catch (err) {
      logger.error(`[vite-cdn-copy-plugin]: Failed to copy ${srcPath} to ${fullDestPath}`, err)
    }
  }
}

/**
 * 创建复制插件
 * @param {Array<Object>} targets - 复制目标配置数组
 * @param {string|Array<string>} targets[].src - 源文件路径或路径数组
 * @param {string|Array<string>} targets[].dest - 目标文件路径或路径数组
 * @returns {Object} Vite插件对象
 */

function copyPlugin(targets) {
  let resolvedConfig = null
  let copiedFiles = new Set()

  return {
    name: 'vite-cdn-copy-plugin',
    configResolved(getResolvedConfig) {
      resolvedConfig = getResolvedConfig
    },
    async writeBundle() {
      if (!targets || !targets.length) {
        return
      }

      const outDir = resolvedConfig.build.outDir || 'dist'

      logger.log('[vite-cdn-copy-plugin]: Start copying files to dist directory')

      // 遍历所有复制目标
      for (const target of targets) {
        const { src, dest } = target

        if (!src || !dest) {
          logger.warn('[vite-cdn-copy-plugin]: Skipping target with missing src or dest', target)
          continue
        }

        // 处理源路径，支持数组形式
        // const srcPaths = (Array.isArray(src) ? src : [src]).map(item => path.resolve(process.cwd(), item))
        const srcPaths = Array.isArray(src) ? src : [src]
        // 处理目标路径，支持数组形式
        const destPaths = Array.isArray(dest) ? dest : [dest]

        for (const srcPath of srcPaths) {
          await copyFileOrDirectory(srcPath, destPaths, copiedFiles, outDir)
        }
      }

      logger.log('[vite-cdn-copy-plugin]: Finished copying files')
    }
  }
}

/**
 * 比较两个版本号是否相同
 * @param {string} versionOrigin - 源版本号, 可能包含 ^ 或 ~ 开头
 * @param {string} versionTarget - 目标版本号,来源于 package.json 的 version, 不能包含 ^ 或 ~ 开头
 * @returns {boolean} - 是否相同
 */
const compareIsSameVersion = (versionOrigin, versionTarget) => {
  if (versionOrigin === versionTarget) {
    return true
  }

  if (versionOrigin.startsWith('^')) {
    // 如果源版本号是 ^ 开头，则只比较第一个数字是否相同
    return versionOrigin.slice(1, 2) === versionTarget.slice(0, 1)
  }

  if (versionOrigin.startsWith('~')) {
    // 如果源版本号是 ~ 开头，则只比较前两个数字是否相同
    return versionOrigin.slice(1, 3) === versionTarget.slice(0, 3)
  }

  return false
}

function getCdnPathNpmInfo(
  cdnDependencyItem,
  base, // build构建的base（BASE_URL）参数
  cdnDir, // 复制到目标的文件目录
  tempDir = 'bundle-deps', // 新安装包的安装目录
  copyConfig = {} // 复制配置
) {
  let { packageName, version, filePathInPackage } = cdnDependencyItem
  const originVersion = version

  if (copyConfig[packageName]) {
    const { version: copyVersion, filePathInPackage: copyFilePathInPackage } = copyConfig[packageName]

    if (copyVersion) {
      version = copyVersion
    }
    if (copyFilePathInPackage) {
      filePathInPackage = copyFilePathInPackage
    }
  }

  let isFolder = filePathInPackage.endsWith('/')
  let src = `node_modules/${packageName}${filePathInPackage}`
  const pkgFilePath = `node_modules/${packageName}/package.json`
  let isSameVersion = false

  if (fs.existsSync(pkgFilePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(pkgFilePath)))
      isSameVersion = compareIsSameVersion(version, pkg.version)
    } catch (error) {
      // ignore
    }
  }
  // 只有包存在 且 版本号一致 才认为源文件存在
  const sourceExist = fs.existsSync(path.resolve(src)) && isSameVersion

  if (sourceExist) {
    const stat = fs.statSync(path.resolve(src))
    if (stat.isDirectory()) {
      isFolder = true
    }
  } else {
    src = tempDir + '/' + src
  }

  const destPackageDir = `${cdnDir}/${packageName}@${originVersion}`
  const destFullPath = `${destPackageDir}${filePathInPackage}`
  const destFullPathWithoutTailSlash = destFullPath
  const dest = destFullPathWithoutTailSlash
  let destDir = dest

  // 不是文件夹，则取文件所在目录
  if (!isFolder) {
    destDir = path.dirname(destFullPathWithoutTailSlash)
  }

  return {
    src,
    packageName,
    version,
    sourceExist,
    dest: destDir
  }
}

/**
 * 本地化CDN插件
 * @param {Object} options - 配置选项
 * @param {Object} options.localCdnConfig - 本地CDN配置
 * @param {Object} options.localCdnConfig.importMap - 导入映射配置，定义需要本地化的CDN依赖
 * @param {Object} options.localCdnConfig.copy - 自定义复制配置，可以覆盖特定包的默认配置
 * @param {string} options.base - 构建的base URL
 * @param {string} options.cdnDir - 构建目录中的CDN文件夹名称
 * @param {string} options.bundleTempDir - 临时存放下载的包的目录
 * @returns {Array} - Vite插件数组
 */
export function localCdnPlugin({
  localCdnConfig = { importMap: { imports: {} }, copy: {} },
  base = './',
  cdnDir = 'local-cdn-static', // 构建目录中的CDN文件夹名称
  bundleTempDir = 'bundle-deps/local-cdn' // 临时存放下载的包的目录
}) {
  const importMapConfig = localCdnConfig.importMap || { imports: {} }
  const copyConfig = localCdnConfig.copy || {}

  const defaultImportMapConfig = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), './node_modules/@opentiny/tiny-engine/dist/import-map.json'), 'utf-8')
  )
  const parsedDefaultImportMapConfig = Object.values(defaultImportMapConfig.imports).map((item) => extractInfo(item))
  const parsedImportMapConfig = Object.values(importMapConfig.imports).map((item) => extractInfo(item))
  const overriddenImportMap = parsedDefaultImportMapConfig.filter((item) => {
    return !parsedImportMapConfig.find((parsedItem) => parsedItem.packageName === item.packageName)
  })
  const combinedImportMapConfig = [...overriddenImportMap, ...parsedImportMapConfig]

  if (combinedImportMapConfig.length === 0) {
    logger.warn('[local-cdn-plugin]: No CDN dependencies found or configured')
    return []
  }
  const combinedCopyConfig = { ...defaultCopyConfig, ...copyConfig }

  // 处理每个CDN URL，获取复制信息
  const cdnFiles = combinedImportMapConfig.map((cdnDependencyItem) =>
    getCdnPathNpmInfo(cdnDependencyItem, base, cdnDir, bundleTempDir, combinedCopyConfig)
  )

  // 获取需要安装的包列表和文件列表
  const packageNeedToInstall = cdnFiles
    .filter((item) => !item.sourceExist)
    .map(({ packageName, version }) => ({ packageName, version }))
    .reduce((acc, cur) => {
      // 同个包避免多个版本只保留一个版本
      if (!acc.some(({ packageName }) => cur.packageName === packageName)) {
        acc.push(cur)
      }
      return acc
    }, [])

  // 日志一下将要处理的内容
  logger.log(
    `[local-cdn-plugin]: Processing ${combinedImportMapConfig.length} CDN dependencies to local directory: ${cdnDir}`
  )
  logger.log(`[local-cdn-plugin]: Need to install ${packageNeedToInstall.length} packages`)

  const targetFiles = dedupeCopyFiles(cdnFiles)
  // 返回插件数组
  return [
    // 创建环境变量替换插件，替换CDN域名为本地路径
    createEnvReplacementPlugin(cdnDir, base),
    // 安装需要的包
    ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
    // 使用自定义的copyPlugin替代直接调用copy
    copyPlugin(targetFiles)
  ]
}
