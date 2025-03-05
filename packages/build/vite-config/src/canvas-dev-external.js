import vitePluginExternalize from 'vite-plugin-externalize-dependencies'
import { genImportMapPlugin } from './vite-plugins/genImportMapOnly.js'
export function canvasDevExternal(override = {}) {
  const prefix = '/node_modules/@opentiny/tiny-engine'

  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    externals: [/^@opentiny\/vue$/, /^@opentiny\/vue-icon$/],
    imports: {
      '@opentiny/vue': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-pc.mjs`,
      '@opentiny/vue-icon': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-icon.mjs`
    },
    importStyles: [`${prefix}/node_modules/@opentiny/vue-theme/index.css`]
  }
  // 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
  const tinyVueRequire = {
    imports: {
      '@opentiny/vue-common': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-common.mjs`,
      '@opentiny/vue-locale': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-locale.mjs`
    }
  }
  return [
    vitePluginExternalize({ externals: [/^vue$/, /^vue-i18n$/, ...blockRequire.externals] }),
    genImportMapPlugin(
      {
        imports: {
          vue: `${prefix}/node_modules/vue/dist/vue.runtime.esm-browser.js`,
          'vue-i18n': `${prefix}/node_modules/vue-i18n/dist/vue-i18n.esm-browser.js`,
          ...blockRequire.imports,
          ...tinyVueRequire.imports,
          ...override
        }
      },
      [...blockRequire.importStyles]
    )
  ]
}
