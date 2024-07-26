import vitePluginExternalize from 'vite-plugin-externalize-dependencies'
import { genImportMapPlugin } from './vite-plugins/genImportMapOnly.js'
export function canvasDevExternal(override = {}) {
  const prefix = '/node_modules/@opentiny/tiny-engine'

  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    externals: [/^@opentiny\/vue$/, /^@opentiny\/vue-icon$/],
    imports: {
      '@opentiny/vue': `${prefix}/node_modules/@opentiny/vue/runtime/tiny-vue.mjs`,
      '@opentiny/vue-icon': `${prefix}/node_modules/@opentiny/vue/runtime/tiny-vue-icon.mjs`
    },
    importStyles: [`${prefix}/@opentiny/vue-theme/index.css`]
  }
  return [
    vitePluginExternalize({ externals: [/^vue$/, /^vue-i18n$/, ...blockRequire.externals] }),
    genImportMapPlugin(
      {
        imports: {
          vue: `${prefix}/node_modules/vue/dist/vue.runtime.esm-browser.js`,
          'vue-i18n': `${prefix}/node_modules/vue-i18n/dist/vue-i18n.esm-browser.js`,
          ...blockRequire.imports,
          ...override
        }
      },
      [...blockRequire.importStyles]
    )
  ]
}
