import path from 'node:path'
import fg from 'fast-glob'
import { normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { babelReplaceImportPathWithCertainFileName } from './replaceImportPath.mjs'

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
      const reg = new RegExp(`^${cdnPrefix}/(.*?)@${versionPlaceholder}(.*?)$`)

      const packageName = libPath.match(reg)[1]
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
            const result = babelReplaceImportPathWithCertainFileName(content, filename, console)
            return result.code || content
          }
          return content
        }
        const onlyFiles = (globString) =>
          fg.sync(globString + '/**/*', { onlyFiles: true }).map((p) => normalizePath(p)) // viteStaticCopy 自带的glob匹配无法过滤目录， 手动过滤目录作为数组传入
        return [libKey, libPath, onlyFiles(srcPath), distPath, rename, transform, srcPath]
      }
      const pathnameInPackage = libPath.match(reg)[2]
      const srcPath = `node_modules/${packageName}${pathnameInPackage}`.replace(/\/$/, '')
      const distPath = path.dirname(
        `${dir}/${packageName}@${versionPlaceholder}${pathnameInPackage}`.replace(/\/$/, '')
      )
      return [libKey, libPath, srcPath, distPath, null, null, null]
    })
    const copyFiles = files
      .map(([_libKey, _libPath, srcPath, distPath, rename, transform, packageSrc]) => ({
        src: srcPath,
        dest: distPath,
        rename,
        transform,
        packageSrc
      }))
      .reduce((acc, cur) => {
        //去重，分别处理字符串和数组
        if (
          (typeof cur.src === 'string' && !acc.some((item) => item.src === cur.src && item.dest === cur.dest)) ||
          (Array.isArray(cur.src) &&
            !acc.some((item) => !!item.packageSrc && item.packageSrc === cur.packageSrc && item.dest === cur.dest))
        ) {
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
  // 理论上要从resolvedConfig阶段的钩子里面拿到base，由于插件嵌套插件，子插件的配置项需要在resolveConfig前传入这里，无法等resolvedConfig，故手动获取命令行base
  const index = process.argv?.indexOf('--base')
  return index > -1 ? process.argv[index + 1] || fallback : fallback
}
