import path from 'node:path'
import fs from 'fs-extra'
import semver from 'semver'
import { installPackageTemporary } from '../vite-plugins/installPackageTemporary.js'
import { copyPlugin } from '../vite-plugins/cdnCopyPlugin.js'
import { dedupeCopyFiles } from './locateCdnNpmInfo.js'

const logger = console

// 默认的复制配置，这几个 package 需要复制整个目录，所以需要有默认配置进行复制整个目录
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
 * 从importMapUrl字符串中提取包名、版本和文件路径
 * ${versionDelimiter} 和 ${fileDelimiter} 是默认的 importMapUrl 中的占位符，
 * 例如：
 * importMapUrl = '${VITE_CDN_DOMAIN}/${packageName}${versionDelimiter}${version}${fileDelimiter}${filePath}'
 * 提取的信息对象：
 * {
 *   packageName: '${packageName}',
 *   version: '${version}',
 *   filePathInPackage: '${filePath}'
 * }
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
    logger.error(`[import-map-local-plugin]: Failed to extract info from ${str} 提取 importMap 信息失败`, error)
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

  return semver.satisfies(versionTarget, versionOrigin)
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

function parseImportMapLocalConfig(importMapLocalConfig) {
  let parsedImportMapLocalConfig = importMapLocalConfig

  if (!parsedImportMapLocalConfig || typeof parsedImportMapLocalConfig !== 'object') {
    logger.warn('[import-map-local-plugin]: Invalid importMapLocalConfig, using defaults')

    parsedImportMapLocalConfig = { importMap: { imports: {} }, copy: {} }
  }

  if (!parsedImportMapLocalConfig.importMap || typeof parsedImportMapLocalConfig.importMap !== 'object') {
    logger.warn('[import-map-local-plugin]: Invalid importMapConfig, using defaults')

    parsedImportMapLocalConfig.importMap = { imports: {} }
  }

  if (!parsedImportMapLocalConfig.copy || typeof parsedImportMapLocalConfig.copy !== 'object') {
    logger.warn('[import-map-local-plugin]: Invalid copyConfig, using defaults')

    parsedImportMapLocalConfig.copy = {}
  }

  return parsedImportMapLocalConfig
}

/**
 * 本地化CDN插件
 * @param {Object} options - 配置选项
 * @param {Object} options.importMapLocalConfig - 本地CDN配置
 * @param {Object} options.importMapLocalConfig.importMap - 导入映射配置，定义需要本地化的CDN依赖
 * @param {Object} options.importMapLocalConfig.copy - 自定义复制配置，可以覆盖特定包的默认配置
 * @param {string} options.base - 构建的base URL
 * @param {string} options.cdnDir - 构建目录中的CDN文件夹名称
 * @param {string} options.bundleTempDir - 临时存放下载的包的目录
 * @returns {Array} - Vite插件数组
 */
export function importMapLocalPlugin({
  importMapLocalConfig = { importMap: { imports: {} }, copy: {} },
  base = './',
  cdnDir = 'local-cdn-static', // 构建目录中的CDN文件夹名称
  bundleTempDir = 'bundle-deps/local-cdn' // 临时存放下载的包的目录
}) {
  let parsedImportMapLocalConfig = parseImportMapLocalConfig(importMapLocalConfig)

  const copyConfig = parsedImportMapLocalConfig.copy || {}
  const defaultImportMapConfig = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), './node_modules/@opentiny/tiny-engine/dist/import-map.json'), 'utf-8')
  )
  const parsedDefaultImportMapConfig = Object.values(defaultImportMapConfig.imports)
    .map((item) => extractInfo(item))
    .filter(Boolean)
  const parsedImportMapConfig = Object.values(parsedImportMapLocalConfig.importMap.imports)
    .map((item) => extractInfo(item))
    .filter(Boolean)
  // 处理内置的物料样式，后续不再内置物料后，需要用户自行引入，相关逻辑也需要同步删除
  const parsedImportMapStylesConfig = Object.values(defaultImportMapConfig.importStyles || {})
    .map((item) => extractInfo(item))
    .filter(Boolean)
  const overriddenImportMap = parsedDefaultImportMapConfig.filter((item) => {
    return !parsedImportMapConfig.find((parsedItem) => parsedItem.packageName === item.packageName)
  })
  const combinedImportMapConfig = [...overriddenImportMap, ...parsedImportMapConfig, ...parsedImportMapStylesConfig]

  if (combinedImportMapConfig.length === 0) {
    logger.warn('[import-map-local-plugin]: No CDN dependencies found or configured')
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
    `[import-map-local-plugin]: Processing ${combinedImportMapConfig.length} CDN dependencies to local directory: ${cdnDir}`
  )
  logger.log(`[import-map-local-plugin]: Need to install ${packageNeedToInstall.length} packages`)

  const targetFiles = dedupeCopyFiles(cdnFiles)
  // 返回插件数组
  return [
    // 安装需要的包
    ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
    // 使用自定义的copyPlugin替代直接调用copy
    copyPlugin(targetFiles)
  ]
}
