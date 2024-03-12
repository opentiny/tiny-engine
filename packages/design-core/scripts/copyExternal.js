import { viteStaticCopy } from 'vite-plugin-static-copy'
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
  const copyImportMapFilePlugin = (imports) => {
    const files = Object.entries(imports).map(([libKey, libPath]) => {
      const srcPath = libPath
        .replace(new RegExp('^' + cdnPrefix + '/' + '(.*?)' + '@' + versionPlaceholder), 'node_modules/$1')
        .replace(/\/$/, '')
      const distPath = libPath
        .replace(new RegExp('^' + cdnPrefix + '/'), dir + '/')
        .replace(/\/$/, '')
        .replace(/\/([^/]*?)$/, '')
      return [libKey, libPath, srcPath, distPath]
    })
    const copyFiles = files.map(([_libKey, _libPath, srcPath, distPath]) => ({
      src: srcPath,
      dest: distPath
    }))
    return viteStaticCopy({
      targets: copyFiles
    })
  }
  return {
    cdnPrefix, // 替换VITE_CDN_DOMAIN
    versionPlaceholder, //替换@version中的version
    copyImportMapFilePlugin
  }
}
