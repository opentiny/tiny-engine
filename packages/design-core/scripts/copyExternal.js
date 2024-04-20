import { viteStaticCopy } from 'vite-plugin-static-copy'
import { getCdnPathNpmInfoForPackage, getCdnPathNpmInfoForSingleFile } from './localCdnFile/locateCdnNpmInfo'
import { importmapPlugin } from './externalDeps'

export const useLocalImportMap = (flag, publicPath = '/', dir = 'import-map-static', originCdnPrefix) => {
  if (!flag) {
    return {
      cdnPrefix: null,
      distDir: null,
      versionPlaceholder: null,
      copyImportMapFilePlugin: (_) => null
    }
  }
  const copyImportMapFilePlugin = (imports, packageCopy) => {
    const files = Object.entries(imports)
      .filter(([_libKey, libPath]) => libPath.startsWith(originCdnPrefix))
      .map(([libKey, libPath]) => {
        if (packageCopy.includes(libKey)) {
          return getCdnPathNpmInfoForPackage(libPath, originCdnPrefix, publicPath, dir, true)
        }
        return getCdnPathNpmInfoForSingleFile(libPath, originCdnPrefix, publicPath, dir, false)
      })
    const copyFiles = files.reduce((acc, cur) => {
      //去重，分别处理字符串和数组
      if (
        (typeof cur.src === 'string' && !acc.some((item) => item.src === cur.src && item.dest === cur.dest)) ||
        (Array.isArray(cur.src) &&
          !acc.some((item) => !!item.folder && item.folder === cur.folder && item.dest === cur.dest))
      ) {
        acc.push(cur)
      }
      return acc
    }, [])
    return copyFiles.length
      ? [
          ...viteStaticCopy({
            targets: copyFiles
          }),
          importmapPlugin(
            {
              imports: Object.fromEntries(
                Object.entries(imports).map(([k, v]) => [k, files.find((f) => f.originUrl === v)?.newUrl ?? v])
              )
            },
            ['./import-map-static/@opentiny/vue-theme@3.11.6/index.css']
          )
        ]
      : []
  }
  return {
    cdnPrefix: null,
    distDir: dir,
    versionPlaceholder: null, //替换@version中的version
    copyImportMapFilePlugin
  }
}
