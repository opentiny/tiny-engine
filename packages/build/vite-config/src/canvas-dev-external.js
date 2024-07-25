import vitePluginExternalize from 'vite-plugin-externalize-dependencies'
import { genImportMapPlugin } from './vite-plugins/genImportMapOnly.js'
export function canvasDevExternal(override = {}) {
  const prefix = '/node_modules/@opentiny/tiny-engine'
  return [
    vitePluginExternalize({ externals: [/^vue$/, /^vue-i18n$/] }),
    genImportMapPlugin({
      imports: {
        vue: `${prefix}/node_modules/vue/dist/vue.runtime.esm-browser.js`,
        'vue-i18n': `${prefix}/node_modules/vue-i18n/dist/vue-i18n.esm-browser.js`,
        ...override
      }
    })
  ]
}
