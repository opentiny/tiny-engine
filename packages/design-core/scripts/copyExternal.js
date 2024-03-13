import { viteStaticCopy } from 'vite-plugin-static-copy'
import { replaceImportPath } from './replaceImportPath.mjs'

export const handleStaticFileRelativeImport = (dirs, option = { detail: false }) => {
  let config
  return {
    name: 'vite-plugin-replace-import:build',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async closeBundle() {
      const logger = config.logger
      const outputDir = config.build.outDir
      const processDirs = dirs.map((dir) => `${outputDir}/${dir}`)
      replaceImportPath(processDirs, logger).then(({ fileList, success, error, errorFileList }) => {
        logger.info(
          `[vite-plugin-replace-import]: relative path replaced with certain file path total ${success.length} path(s) in ${fileList.length} file(s)`
        )
        if (success.length) {
          option.detail && logger.info(success)
        }
        if (error?.length) {
          logger.info(
            `[vite-plugin-replace-import]: error found in total ${error.length} path(s) in ${errorFileList.length} file(s)`
          )
          option.detail && logger.info(error)
        }
      })
    }
  }
}

export const useLocalImportMap = (flag, publicPath = '', dir = 'import-map-static') => {
  if (!flag) {
    return {
      cdnPrefix: null,
      versionPlaceholder: null,
      copyImportMapFilePlugin: (_) => null
    }
  }
  const cdnPrefix = publicPath + (!publicPath || publicPath.endsWith('/') ? '' : '/') + dir
  const versionPlaceholder = 'workspace'
  const copyImportMapFilePlugin = (imports, packageCopy) => {
    const files = Object.entries(imports).map(([libKey, libPath]) => {
      if (packageCopy.includes(libKey)) {
        const srcPath = libPath
          .replace(new RegExp('^' + cdnPrefix + '/' + '(.*?)' + '@' + versionPlaceholder + '.*?$'), 'node_modules/$1')
          .replace(/\/$/, '')
        const distFullPath = libPath
          .replace(new RegExp('^' + cdnPrefix + '/' + '(.*?' + '@' + versionPlaceholder + ')' + '.*?$'), dir + '/$1')
          .replace(/\/$/, '')
        const distPath = distFullPath.replace(/\/([^/]*?)$/, '')
        const rename = distFullPath.match(/\/([^/]*?)$/)?.[1]

        return [libKey, libPath, srcPath, distPath, rename]
      }
      const srcPath = libPath
        .replace(new RegExp('^' + cdnPrefix + '/' + '(.*?)' + '@' + versionPlaceholder), 'node_modules/$1')
        .replace(/\/$/, '')
      const distPath = libPath
        .replace(new RegExp('^' + cdnPrefix + '/'), dir + '/')
        .replace(/\/$/, '')
        .replace(/\/([^/]*?)$/, '')
      return [libKey, libPath, srcPath, distPath, null]
    })
    const copyFiles = files
      .map(([_libKey, _libPath, srcPath, distPath, rename]) => ({
        src: srcPath,
        dest: distPath,
        rename: rename
      }))
      .reduce((acc, cur) => {
        //去重
        if (!acc.some((item) => item.src === cur.src && item.dest === cur.dest)) {
          acc.push(cur)
        }
        return acc
      }, [])

    const handleImport = copyFiles.filter(({ rename }) => !!rename).map(({ dest, rename }) => `${dest}/${rename}`)
    return [
      ...viteStaticCopy({
        targets: copyFiles
      }),
      handleStaticFileRelativeImport(handleImport)
    ]
  }
  return {
    cdnPrefix, // 替换VITE_CDN_DOMAIN
    versionPlaceholder, //替换@version中的version
    copyImportMapFilePlugin
  }
}

export const getBaseUrlFromCli = (fallback = '') => {
  const index = process.argv?.indexOf('--base')
  return index > -1 ? process.argv[index + 1] || fallback : fallback
}
