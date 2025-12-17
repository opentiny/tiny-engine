export const prefix = '/node_modules/@opentiny/tiny-engine'
export const dependencies = {
  base: {
    imports: {
      vue: `${prefix}/node_modules/vue/dist/vue.runtime.esm-browser.js`,
      'vue-i18n': `${prefix}/node_modules/vue-i18n/dist/vue-i18n.esm-browser.js`
    },
    externals: [/^vue$/, /^vue-i18n$/]
  },
  ui: {
    imports: {
      '@opentiny/vue': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-pc.mjs`,
      '@opentiny/vue-icon': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-icon.mjs`,
      '@opentiny/vue-common': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-common.mjs`,
      '@opentiny/vue-locale': `${prefix}/node_modules/@opentiny/vue-runtime/dist3/tiny-vue-locale.mjs`
    },
    externals: [/^@opentiny\/vue$/, /^@opentiny\/vue-icon$/, /^@opentiny\/vue-common$/, /^@opentiny\/vue-locale$/],
    importStyles: [`${prefix}/node_modules/@opentiny/vue-theme/index.css`]
  }
}
