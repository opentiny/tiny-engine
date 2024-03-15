import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'glob'
import { parse } from '@babel/core'
import traversePkg from '@babel/traverse'
import generatePkg from '@babel/generator'
const traverse = traversePkg.default
const generate = generatePkg.default

const flattenReducer = (acc, cur) => [...acc, ...cur]

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

export function babelReplaceImportPathWithCertainFIleName(content, currentFilePath, logger) {
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
/**
 * 入口函数 replaceImportPath
 * 1） 扫描dirs文件夹内的js文件
 * 2） 分析js文件内部的相对路径引用，替换成确定带完整文件名和后缀的相对文件路径
 * @param {Array<string>} dirs 需要处理的目录的数组
 */
export function replaceImportPath(dirs, logger = console) {
  const files = dirs.map(dir => glob.sync(`${path.resolve(dir)}/**/*.js`)).reduce(flattenReducer, [])
  return Promise.all(files.map(async file => {
    const content = await fsPromise.readFile(file, {encoding: 'utf-8'})
    const { code, success, error} = babelReplaceImportPathWithCertainFIleName(content, file, logger)
    if (code) {
      await fsPromise.writeFile(file, code, { encoding: 'utf-8' })
    }
    return {
      file,
      changed: !!code,
      success,
      error
    }
  })).then(arr => {
    const success = arr.map(item => item.success.map(s => ({...s, file: item.file}))).reduce(flattenReducer, [])
    const error = arr.map(item => item.error.map(e => ({notFound: e, file: item.file}))).reduce(flattenReducer, [])
    const fileList = arr.filter(item => item.changed)
    const errorFileList = arr.filter(item => item.error?.length)
    return {
      fileList,
      success,
      error,
      errorFileList
    }
  })
}
