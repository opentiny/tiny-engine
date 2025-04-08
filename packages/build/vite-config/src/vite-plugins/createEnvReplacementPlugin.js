/**
 * 创建环境变量替换插件
 * @param {string} cdnDir - 本地CDN目录名
 * @returns {Object} - Vite插件对象
 */
export function createEnvReplacementPlugin(cdnDir, base) {
  return {
    name: 'vite-replace-cdn-env',
    config(config) {
      // 在构建时替换环境变量，将CDN域名替换为本地路径
      if (!config.define) {
        config.define = {}
      }

      config.define['import.meta.env.VITE_CDN_DOMAIN'] = JSON.stringify(
        `${base.endsWith('/') ? base : base + '/'}${cdnDir}`
      )
      // 使用本地 CDN 时，强制设置CDN类型为 local
      config.define['import.meta.env.VITE_CDN_TYPE'] = JSON.stringify('local')
    }
  }
}
