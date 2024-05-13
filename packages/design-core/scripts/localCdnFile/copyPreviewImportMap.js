import path from 'node:path'
import { readJsonSync } from 'fs-extra'
import {
  getPackageNeedToInstallAndFilesUsingSameVersion,
  copyfileToDynamicSrcMapper,
  dedupeCopyFiles,
  getCdnPathNpmInfoForPackage,
  getCdnPathNpmInfoForSingleFile
} from './locateCdnNpmInfo'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { installPackageTemporary } from '../vite-plugins/installPackageTemporary'

export function extraPreviewImport(filename, originCdnPrefix) {
  const result = []
  const importMap = readJsonSync(filename)
  Object.entries(importMap.imports)?.forEach(([_key, location]) => {
    const url = location.replace('${VITE_CDN_DOMAIN}', originCdnPrefix).replace('${opentinyVueVersion}', '~3.14')
    if (url?.startsWith(originCdnPrefix) && !result.includes(url)) {
      result.push(url)
    }
  })
  return result
}

export function replacePreviewImport(importMap, fileMap, originCdnPrefix) {
  return {
    imports: Object.fromEntries(
      Object.entries(importMap.imports)?.map(([key, location]) => {
        // 这里的替换占位符规则等同于packages/design-core/src/preview/src/preview/importMap.js, 两边修改需要同步
        const url = location.replace('${VITE_CDN_DOMAIN}', originCdnPrefix).replace('${opentinyVueVersion}', '~3.14')
        const matchRule = fileMap.find((rule) => url === rule.originUrl)
        if (matchRule) {
          return [key, matchRule.newUrl]
        }
        return [key, location]
      })
    )
  }
}

export function extraPreviewImportFile(filename, targetFileName, originCdnPrefix) {
  return (fileMap) => [
    {
      src: filename,
      dest: path.dirname(targetFileName),
      transform: (content) => {
        return JSON.stringify(replacePreviewImport(JSON.parse(content), fileMap, originCdnPrefix), null, 2)
      },
      rename: path.basename(targetFileName)
    }
  ]
}

export function copyPreviewImportMap({
  importMapJson,
  targetImportMapJson,
  originCdnPrefix,
  base,
  dir = 'preview-import-map-static',
  bundleTempDir = 'bundle-deps/preview-import-map',
  packageCopyLib = [] // 值为cdn地址上的包名
}) {
  const cdnFiles = extraPreviewImport(importMapJson, originCdnPrefix).map((url) => {
    const { packageName } = url.match(
      new RegExp(`^${originCdnPrefix}/?(?<packageName>.+?)@(?<versionDemand>[^/]+)(?<filePathInPackage>.*?)$`)
    ).groups
    if (packageCopyLib.includes(packageName)) {
      return getCdnPathNpmInfoForPackage(url, originCdnPrefix, base, dir, true, bundleTempDir)
    }
    return getCdnPathNpmInfoForSingleFile(url, originCdnPrefix, base, dir, false, bundleTempDir)
  })
  const { packages: packageNeedToInstall, files } = getPackageNeedToInstallAndFilesUsingSameVersion(cdnFiles)
  return [
    ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
    ...viteStaticCopy({
      targets: [
        ...dedupeCopyFiles(files).map(copyfileToDynamicSrcMapper),
        ...extraPreviewImportFile(importMapJson, targetImportMapJson, originCdnPrefix)(files)
      ]
    })
  ]
}
