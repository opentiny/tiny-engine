import { readJsonFile } from './copyBundleDeps'
import path from 'node:path'

export function extraCanvasImport(filename, originCdnPrefix) {
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

export function replaceCanvasImport(importMap, fileMap, originCdnPrefix) {
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

export function extraCanvasImportFile(filename, targetFileName, originCdnPrefix) {
  return (fileMap) => [
    {
      src: filename,
      dest: path.dirname(targetFileName),
      transform: (content) => {
        return JSON.stringify(replaceCanvasImport(JSON.parse(content), fileMap, originCdnPrefix), null, 2)
      },
      rename: path.basename(targetFileName)
    }
  ]
}
