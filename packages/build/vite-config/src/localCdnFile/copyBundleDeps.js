import path from 'node:path'
import fs from 'fs-extra'
import { installPackageTemporary } from '../vite-plugins/installPackageTemporary.js'
import { configServerAddProxy } from '../vite-plugins/configureServerAddProxy.js'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import {
  getCdnPathNpmInfoForSingleFile,
  getPackageNeedToInstallAndFilesUsingSameVersion,
  dedupeCopyFiles,
  copyfileToDynamicSrcMapper
} from './locateCdnNpmInfo.js'

const { readJsonSync } = fs

export function extraBundleCdnLink(filename, originCdnPrefix) {
  const result = new Set()
  const bundle = readJsonSync(filename)
  bundle.data?.materials?.packages?.forEach((packageItem) => {
    if (packageItem) {
      const possibleUrl = [packageItem.script, packageItem.css]
      possibleUrl.forEach((url) => {
        if (url?.startsWith(originCdnPrefix)) {
          result.add(url)
        }
      })
    }
  })

  return [...result]
}

export function replaceBundleCdnLink(bundle, fileMap) {
  bundle.data?.materials?.packages?.forEach((packageItem) => {
    if (packageItem) {
      const possibleUrl = ['script', 'css']
      possibleUrl.forEach((key) => {
        const matchRule = fileMap.find((rule) => packageItem[key] === rule.originUrl)
        if (matchRule) {
          packageItem[key] = matchRule.newUrl
        }
      })
    }
  })
}

export function copyBundleDeps({
  bundleFile,
  targetBundleFile,
  originCdnPrefix,
  base,
  dir = 'material-static',
  bundleTempDir = 'bundle-deps/material-static'
}) {
  const cdnFiles = extraBundleCdnLink(bundleFile, originCdnPrefix)
    .map((url) => getCdnPathNpmInfoForSingleFile(url, originCdnPrefix, base, dir, false, bundleTempDir))
    .filter(Boolean)

  const { packages: packageNeedToInstall, files } = getPackageNeedToInstallAndFilesUsingSameVersion(cdnFiles)

  const plugin = (isDev) => {
    return [
      ...(isDev ? configServerAddProxy(targetBundleFile, targetBundleFile.replace(/\.([^.]+?$)/, '-local.$1')) : []),
      ...installPackageTemporary(packageNeedToInstall, bundleTempDir),
      ...viteStaticCopy({
        targets: [
          ...dedupeCopyFiles(files).map(copyfileToDynamicSrcMapper),
          {
            src: bundleFile,
            dest: path.dirname(targetBundleFile),
            transform: (content) => {
              const json = JSON.parse(content)
              replaceBundleCdnLink(json, files)
              return JSON.stringify(json, null, 2)
            },
            rename: (filename, fileExtension) =>
              isDev ? `${filename}-local.${fileExtension}` : path.basename(targetBundleFile),
            overwrite: true // 覆盖public的
          }
        ]
      })
    ]
  }
  return {
    plugin
  }
}
