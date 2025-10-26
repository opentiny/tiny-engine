import importMapConfig from './import-map.json'

const IMPORT_MAP_ELEMENT_ID = 'tiny-engine-runtime-import-map'

type ImportMapConfig = {
  imports?: Record<string, string>
  importStyles?: Record<string, string>
}

const DEFAULT_ENV = {
  VITE_CDN_TYPE: 'unpkg',
  VITE_CDN_DOMAIN: 'https://unpkg.com',
  VITE_LOCAL_IMPORT_PATH: 'local-cdn-static',
  BASE_URL: '/',
  VITE_LOCAL_IMPORT_MAPS: 'false'
}

const getEnvValue = (key: keyof typeof DEFAULT_ENV) => {
  return DEFAULT_ENV[key]
}

const replacePlaceholder = (value: string) => {
  const VITE_CDN_TYPE = getEnvValue('VITE_CDN_TYPE')
  const VITE_CDN_DOMAIN = getEnvValue('VITE_CDN_DOMAIN')
  const VITE_LOCAL_IMPORT_PATH = getEnvValue('VITE_LOCAL_IMPORT_PATH')
  const BASE_URL = getEnvValue('BASE_URL')
  const VITE_LOCAL_IMPORT_MAPS = getEnvValue('VITE_LOCAL_IMPORT_MAPS')

  const isLocalBundle = String(VITE_LOCAL_IMPORT_MAPS) === 'true'
  const versionDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/' : '@'
  const fileDelimiter = VITE_CDN_TYPE === 'npmmirror' && !isLocalBundle ? '/files' : ''
  const cdnDomain = isLocalBundle ? `${BASE_URL}${VITE_LOCAL_IMPORT_PATH}` : VITE_CDN_DOMAIN

  return value
    .replace('${VITE_CDN_DOMAIN}', cdnDomain)
    .replace('${versionDelimiter}', versionDelimiter)
    .replace('${fileDelimiter}', fileDelimiter)
}

const parseImportMapConfig = (config: ImportMapConfig) => {
  const imports: Record<string, string> = {}
  const importStyles: string[] = []

  Object.entries(config.imports || {}).forEach(([name, url]) => {
    imports[name] = replacePlaceholder(url)
  })

  Object.values(config.importStyles || {}).forEach((url) => {
    const parsed = replacePlaceholder(url)
    importStyles.push(parsed)
  })

  return { imports, importStyles }
}

const mergeImportMap = (imports: Record<string, string>) => {
  if (typeof document === 'undefined') {
    return
  }

  const existing = document.getElementById(IMPORT_MAP_ELEMENT_ID) as HTMLScriptElement | null
  const mergedImports: Record<string, string> = {}

  if (existing?.textContent) {
    try {
      const parsed = JSON.parse(existing.textContent)
      Object.assign(mergedImports, parsed?.imports || {})
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[runtime-import-map] 解析已有 import map 失败，将覆盖为新的配置。', err)
    }
  }

  Object.assign(mergedImports, imports)

  const importMapScript = existing || document.createElement('script')
  importMapScript.type = 'importmap'
  importMapScript.id = IMPORT_MAP_ELEMENT_ID
  importMapScript.textContent = JSON.stringify({ imports: mergedImports }, null, 2)

  if (!existing) {
    document.head.appendChild(importMapScript)
  }
}

export const initImportMap = () => {
  const { imports: baseImports } = parseImportMapConfig(importMapConfig)

  mergeImportMap({ ...baseImports })
}

export default initImportMap
