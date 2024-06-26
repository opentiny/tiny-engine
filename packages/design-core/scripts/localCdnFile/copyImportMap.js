import { viteStaticCopy } from 'vite-plugin-static-copy'
import {
  getPackageNeedToInstallAndFilesUsingSameVersion,
  copyfileToDynamicSrcMapper,
  dedupeCopyFiles,
  getCdnPathNpmInfoForPackage,
  getCdnPathNpmInfoForSingleFile
} from './locateCdnNpmInfo'
import { importmapPlugin } from '../externalDeps'
import { installPackageTemporary } from '../vite-plugins/installPackageTemporary'

export const copyLocalImportMap = ({
  importMap,
  styleUrls,
  originCdnPrefix,
  base,
  dir = 'import-map-static',
  bundleTempDir = 'bundle-deps/design-core-import-map',
  packageCopy = [] // 值为importMap的imports的左值 （非右值的地址上的包名）
}) => {
  const importMapFiles = Object.entries(importMap.imports)
    .filter(([_libKey, libPath]) => libPath.startsWith(originCdnPrefix))
    .map(([libKey, libPath]) => {
      if (packageCopy.includes(libKey)) {
        return getCdnPathNpmInfoForPackage(libPath, originCdnPrefix, base, dir, true, bundleTempDir)
      }
      return getCdnPathNpmInfoForSingleFile(libPath, originCdnPrefix, base, dir, false, bundleTempDir)
    })
  const styleFiles = styleUrls
    .filter((styleUrl) => styleUrl.startsWith(originCdnPrefix))
    .map((url) => getCdnPathNpmInfoForSingleFile(url, originCdnPrefix, base, dir, false), bundleTempDir)

  const { packages: packageNeedToInstall, files } = getPackageNeedToInstallAndFilesUsingSameVersion(
    importMapFiles.concat(styleFiles)
  )

  return [
    ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
    ...viteStaticCopy({
      targets: dedupeCopyFiles(files).map(copyfileToDynamicSrcMapper)
    }),
    {
      config(config, { command }) {
        // 处理devAlias带CDN域名， 另外需要使得本地vue和importMap的vue是同一个实例
        if (command === 'serve') {
          config.resolve.alias = [
            ...config.resolve.alias,
            {
              find: /^vue$/,
              replacement: `http://localhost:${config.server.port || 8080}/${
                files.find(({ originUrl }) => importMap.imports.vue === originUrl).newUrl
              }` // 实际端口号需要更具本地启动修改
            }
          ]
        }
      }
    },
    importmapPlugin(
      {
        imports: Object.fromEntries(
          Object.entries(importMap.imports).map(([k, v]) => [k, files.find((f) => f.originUrl === v)?.newUrl ?? v])
        )
      },
      styleUrls.map((url) => styleFiles.find((f) => f.originUrl === url).newUrl ?? url)
    )
  ]
}
