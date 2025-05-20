import path from 'node:path'
import fs from 'fs-extra'
import fg from 'fast-glob'
import { normalizePath } from 'vite'
import { babelReplaceImportPathWithCertainFileName } from '../localCdnFile/replaceImportPath.mjs'

/**
 * 对.js和.mjs文件内容进行转换处理，将import路径如 import { a } from './b' 转换为 import { a} from './b.js'
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @returns {string} - 处理后的内容
 */
function replaceJsImportPaths(content, filename) {
  const result = babelReplaceImportPathWithCertainFileName(content, filename, console)

  return result.code || content
}

const logger = console

async function copyFile(srcPath, destPath) {
  // 确保目标文件的目录存在
  await fs.ensureDir(path.dirname(destPath))

  if (srcPath.endsWith('.js') || srcPath.endsWith('.mjs')) {
    // 读取文件内容
    const content = await fs.readFile(srcPath, 'utf-8')

    // 应用转换
    const transformedContent = replaceJsImportPaths(content, srcPath)
    // 写入转换后的内容
    await fs.writeFile(destPath, transformedContent)
  } else {
    // 复制文件
    await fs.copyFile(srcPath, destPath)
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

      if (isDirectory) {
        // 如果是目录，使用 fast-glob 遍历所有文件并处理
        logger.log(`[vite-cdn-copy-plugin]: Copying directory recursively: ${srcPath} -> ${fullDestPath}`)

        // 确保目标路径存在
        await fs.ensureDir(fullDestPath)

        // 使用绝对路径
        const absoluteSrcPath = normalizePath(path.resolve(process.cwd(), srcPath))

        // 使用 fast-glob 查找所有文件
        const files = fg.sync(`${absoluteSrcPath}/**/*`, { onlyFiles: true })

        // 处理每个文件
        for (const file of files) {
          const relativePath = path.relative(absoluteSrcPath, file)
          const destFilePath = path.join(fullDestPath, relativePath)

          await copyFile(file, destFilePath)
        }
      } else {
        // 如果是单个文件
        logger.log(`[vite-cdn-copy-plugin]: Copying file: ${srcPath} -> ${fullDestPath}`)

        let finalDestPath = path.join(fullDestPath, path.basename(srcPath))

        await copyFile(srcPath, finalDestPath)
      }
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

export function copyPlugin(targets) {
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
