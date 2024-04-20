import { viteStaticCopy } from 'vite-plugin-static-copy'
import {
  dedupeCopyFiles,
  getCdnPathNpmInfoForPackage,
  getCdnPathNpmInfoForSingleFile
} from './localCdnFile/locateCdnNpmInfo'
import { importmapPlugin } from './externalDeps'

export const useLocalImportMap = (
  importMap,
  styles,
  originCdnPrefix,
  publicPath = '/',
  dir = 'import-map-static',
  packageCopy
) => {
  const files = Object.entries(importMap.imports)
    .filter(([_libKey, libPath]) => libPath.startsWith(originCdnPrefix))
    .map(([libKey, libPath]) => {
      if (packageCopy.includes(libKey)) {
        return getCdnPathNpmInfoForPackage(libPath, originCdnPrefix, publicPath, dir, true)
      }
      return getCdnPathNpmInfoForSingleFile(libPath, originCdnPrefix, publicPath, dir, false)
    })
  const styleFiles = styles
    .filter((styleUrl) => styleUrl.startsWith(originCdnPrefix))
    .map((url) => getCdnPathNpmInfoForSingleFile(url, originCdnPrefix, publicPath, dir, false))
  const copyFiles = dedupeCopyFiles(files.concat(styleFiles))
  // 缺少分析需要安装的文件
  return [
    ...viteStaticCopy({
      targets: copyFiles
    }),
    importmapPlugin(
      {
        imports: Object.fromEntries(
          Object.entries(importMap.imports).map(([k, v]) => [k, files.find((f) => f.originUrl === v)?.newUrl ?? v])
        )
      },
      styles.map((url) => styleFiles.find((f) => f.originUrl === url).newUrl ?? url)
    )
  ]
}
