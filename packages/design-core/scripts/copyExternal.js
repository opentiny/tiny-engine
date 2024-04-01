import path from 'node:path'
import fg from 'fast-glob'
import { normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { babelReplaceImportPathWithCertainFIleName } from './replaceImportPath.mjs'

export const useLocalImportMap = (flag, publicPath = '', dir = 'import-map-static') => {
  if (!flag) {
    return {
      cdnPrefix: null,
      distDir: null,
      versionPlaceholder: null,
      copyImportMapFilePlugin: (_) => null
    }
  }
  const cdnPrefix = publicPath + (!publicPath || publicPath.endsWith('/') ? '' : '/') + dir
  const versionPlaceholder = 'workspace'
  const copyImportMapFilePlugin = (imports, packageCopy) => {
    const files = Object.entries(imports).map(([libKey, libPath]) => {
      const packageName = libPath.match(
        new RegExp('^' + cdnPrefix + '/' + '(.*?)' + '@' + versionPlaceholder + '.*?$')
      )[1]
      if (packageCopy.includes(libKey)) {
        const srcPath = `node_modules/${packageName}`
        const distFullPath = `${dir}/${packageName}@${versionPlaceholder}`
        const distPath = path.dirname(distFullPath)
        const packageDirName = path.basename(distFullPath)
        const rename = (_filename, _fileExtension, fullPath) => {
          return packageDirName + '/' + fullPath.replace(srcPath, '')
        }
        const transform = (content, filename) => {
          if (filename.endsWith('.js')) {
            const result = babelReplaceImportPathWithCertainFIleName(content, filename, console)
            return result.code || content
          }
          return content
        }
        const onlyFiles = (globString) =>
          fg.sync(globString + '/**/*', { onlyFiles: true }).map((p) => normalizePath(p)) // viteStaticCopy 自带的glob匹配无法过滤目录， 手动过滤目录作为数组传入
        return [libKey, libPath, onlyFiles(srcPath), distPath, rename, transform]
      }

      const pathnameInPackage = libPath.match(
        new RegExp('^' + cdnPrefix + '/' + '.*?' + '@' + versionPlaceholder + '/(.*?)$')
      )[1]
      const srcPath = `node_modules/${packageName}/${pathnameInPackage}`.replace(/\/$/, '')
      const distPath = path.dirname(
        `${dir}/${packageName}@${versionPlaceholder}/${pathnameInPackage}`.replace(/\/$/, '')
      )
      return [libKey, libPath, srcPath, distPath, null, null]
    })
    const copyFiles = files
      .map(([_libKey, _libPath, srcPath, distPath, rename, transform]) => ({
        src: srcPath,
        dest: distPath,
        rename,
        transform
      }))
      .reduce((acc, cur) => {
        //去重
        if (!acc.some((item) => item.src === cur.src && item.dest === cur.dest)) {
          acc.push(cur)
        }
        return acc
      }, [])
    return viteStaticCopy({
      targets: copyFiles
    })
  }
  return {
    cdnPrefix, // 替换VITE_CDN_DOMAIN
    distDir: dir,
    versionPlaceholder, //替换@version中的version
    copyImportMapFilePlugin
  }
}

export const getBaseUrlFromCli = (fallback = '') => {
  const index = process.argv?.indexOf('--base')
  return index > -1 ? process.argv[index + 1] || fallback : fallback
}
