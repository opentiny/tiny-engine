import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/core'
import traversePkg from '@babel/traverse'
import generatePkg from '@babel/generator'
const traverse = traversePkg.default
const generate = generatePkg.default

/**
 * 将相对路径转换为以'./'开头的格式，并确保使用Unix风格的路径分隔符
 * @param {string} relativePath - 相对路径
 * @returns {string} 转换后的相对路径
 */
export function relativePathPattern(relativePath) {
  return './' + (path.sep === '/' ? relativePath : relativePath.replace(/\\/g, '/'))
}

/**
 * 根据导入路径和当前文件路径，尝试找到实际的文件路径
 * @param {string} importPath - 导入路径
 * @param {string} currentFilePath - 当前文件的完整路径
 * @returns {string|null} 返回解析后的路径，如果找不到则返回null
 */
export function resolvePath(importPath, currentFilePath) {
  if (['js', 'mjs'].some((suffix) => importPath.endsWith(suffix))) {
    // 文件名已经带有.js，.mjs后缀
    return importPath
  }
  const parentPath = path.resolve(currentFilePath, '../')
  const filePrefix = path.resolve(parentPath, importPath)

  if (fs.existsSync(filePrefix)) {
    const stat = fs.statSync(filePrefix)
    if (stat.isDirectory()) {
      let mainFileName = 'index.js'

      const packageFile = path.resolve(filePrefix, 'package.json')

      if (fs.existsSync(packageFile)) {
        const packageFileContent = fs.readFileSync(packageFile, { encoding: 'utf-8' })
        const packageJson = JSON.parse(packageFileContent)
        mainFileName = packageJson.module || packageJson.main || mainFileName
      }

      const mainFile = path.resolve(filePrefix, mainFileName)
      if (fs.existsSync(mainFile)) {
        return relativePathPattern(path.relative(parentPath, mainFile))
      }
      return null
    }
    return importPath
  }
  const possibleSuffix = ['.js', '.mjs']
  const suffix = possibleSuffix.find((suf) => fs.existsSync(filePrefix + suf))
  if (suffix) {
    return relativePathPattern(path.relative(path.resolve(currentFilePath, '../'), filePrefix + suffix))
  }
  return null
}

/**
 * 使用Babel替换JavaScript文件中的相对路径引用为确定的文件后缀
 * @param {string} content - 要处理的代码内容
 * @param {string} currentFilePath - 当前文件的完整路径
 * @param {Console} [logger=console] - 用于记录警告和错误的Logger对象
 * @returns {{code: string|null, success: Array<{before: string, after: string}>, error: Array<string>}}
 *   包含处理后的代码、成功替换的路径和失败的路径
 */
export function babelReplaceImportPathWithCertainFileName(content, currentFilePath, logger = console) {
  let fileChangedMark = false
  let result = {
    code: null,
    success: [],
    error: []
  }
  const ast = parse(content, { sourceType: 'module' })
  traverse(ast, {
    ImportOrExportDeclaration: (astPath) => {
      const node = astPath.node
      if (!node.source) {
        return
      }
      const importPath = node.source.value
      if (importPath.startsWith('.')) {
        const certainPath = resolvePath(importPath, currentFilePath)
        if (!certainPath) {
          logger.warn(`File not found: ${importPath} used in ${currentFilePath}`)
          result.error.push(importPath)
        }
        if (certainPath !== importPath) {
          node.source.value = certainPath
          fileChangedMark = true
          result.success.push({ before: importPath, after: certainPath })
        }
      }
    }
  })
  if (fileChangedMark) {
    const { code } = generate(ast, {
      jsescOption: {
        quotes: 'single'
      }
    })
    result.code = code
  }
  return result
}
