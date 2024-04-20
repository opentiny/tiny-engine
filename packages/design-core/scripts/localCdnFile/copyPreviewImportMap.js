import path from 'node:path'
import {
  analysisPackageNeedToInstallAndModifyFilesMergeToSameVersion,
  dedupeCopyFiles,
  getCdnPathNpmInfoForPackage,
  getCdnPathNpmInfoForSingleFile
} from './locateCdnNpmInfo'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { installPackageTemporary } from '../vite-plugins/installPackageTemporary'
import { readJsonFile } from './utils'

export function extraPreviewImport(filename, originCdnPrefix) {
  const result = []
  const importMap = readJsonFile(filename)
  Object.entries(importMap.imports)?.forEach(([_key, location]) => {
    const url = location.replace('${VITE_CDN_DOMAIN}', originCdnPrefix).replace('${opentinyVueVersion}', '~3.11')
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
        const url = location.replace('${VITE_CDN_DOMAIN}', originCdnPrefix).replace('${opentinyVueVersion}', '~3.11')
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

export function CopyPreviewImportMap(
  importMapJson,
  targetImportMapJson,
  originCdnPrefix,
  base,
  dir,
  packageCopyLib = [],
  bundleTempDir = 'bundle-deps/preview-import-map'
) {
  const cdnFiles = extraPreviewImport(importMapJson, originCdnPrefix).map((url) => {
    const { packageName } = url.match(
      new RegExp(`^${originCdnPrefix}/?(?<packageName>.+?)@(?<versionDemand>[^/]+)(?<filePathInPackage>.*?)$`)
    ).groups
    if (packageCopyLib.includes(packageName)) {
      return getCdnPathNpmInfoForPackage(url, originCdnPrefix, base, dir, true, bundleTempDir)
    }
    return getCdnPathNpmInfoForSingleFile(url, originCdnPrefix, base, dir, false, bundleTempDir)
  })
  const { packages: packageNeedToInstall, files } = analysisPackageNeedToInstallAndModifyFilesMergeToSameVersion(
    dedupeCopyFiles(cdnFiles)
  )
  return [
    ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
    ...viteStaticCopy({
      targets: [
        ...files.map(({ src, dest, transform, rename }) => ({
          src,
          dest,
          transform,
          rename
        })),
        ...extraPreviewImportFile(importMapJson, targetImportMapJson, originCdnPrefix)(files)
      ]
    })
  ]
}
