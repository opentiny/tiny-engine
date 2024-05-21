import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/core'
import traversePkg from '@babel/traverse'
import generatePkg from '@babel/generator'
const traverse = traversePkg.default
const generate = generatePkg.default

export function relativePathPattern(relativePath) {
  return './' + (path.sep === '/' ? relativePath : relativePath.replace(/\\/g, '/'))
}

export function resolvePath(importPath, currentFilePath) {
  if (['js', 'mjs'].some(suffix =>importPath.endsWith(suffix))) { // 文件名已经带有.js，.mjs后缀
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
  const suffix = possibleSuffix.find(suf => fs.existsSync(filePrefix + suf))
  if (suffix) {
    return relativePathPattern(path.relative(path.resolve(currentFilePath, '../'), filePrefix + suffix))
  }
  return null
}

// babel 替换 js的相对地址引用为确定文件后缀
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
      if(importPath.startsWith('.')) {
        const certainPath = resolvePath(importPath, currentFilePath)
        if(!certainPath) {
          logger.warn(`File not found: ${importPath} used in ${currentFilePath}`)
          result.error.push(importPath)
        }
        if(certainPath !== importPath) {
          node.source.value = certainPath
          fileChangedMark = true
          result.success.push({before: importPath, after: certainPath})
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

