import { importMapConfig } from '../localCdnFile/import-map.js'

/**
 * 创建环境变量替换插件
 * @param {string} cdnDir - 本地CDN目录名
 * @param {string} base - 基础路径
 * @param {boolean} isLocalImportMap - 是否是本地CDN
 * @returns {Object} - Vite插件对象
 */
export function createDynamicImportMapPlugin({ cdnDir, base, isLocalImportMap = false }) {
  const virtualModuleId = 'virtual:import-map'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-dynamic-import-map',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        if (isLocalImportMap) {
          const cdnDomain = `${base.endsWith('/') ? base : base + '/'}${cdnDir}`
          const newContent = JSON.stringify(importMapConfig)
            .replaceAll(/\${VITE_CDN_DOMAIN}/g, cdnDomain)
            .replaceAll(/\${versionDelimiter}/g, '@')
            .replaceAll(/\${fileDelimiter}/g, '')

          return `export default ${newContent}`
        }

        return `export default ${JSON.stringify(importMapConfig)}`
      }
    }
  }
}
