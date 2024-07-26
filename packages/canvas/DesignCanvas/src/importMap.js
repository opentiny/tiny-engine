import { VITE_CDN_DOMAIN } from '@opentiny/tiny-engine-controller/js/environments'

const importMapVersions = {
  vue: '3.4.23',
  tinyVue: '~3.14'
}

// 以下内容由于区块WebComponent加载需要补充
const blockRequire = {
  imports: {
    '@opentiny/vue': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue.mjs`,
    '@opentiny/vue-icon': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-icon.mjs`
  },
  importStyles: [`${VITE_CDN_DOMAIN}/@opentiny/vue-theme@${importMapVersions.tinyVue}/index.css`]
}

export const importMap = {
  imports: {
    vue: `${VITE_CDN_DOMAIN}/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.prod.js`,
    'vue-i18n': `${VITE_CDN_DOMAIN}/vue-i18n@9.2.0-beta.36/dist/vue-i18n.esm-browser.js`,
    ...blockRequire.imports
  }
}

export const importStyles = [...blockRequire.importStyles]
