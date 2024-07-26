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
// 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
const tinyVueRequire = {
  imports: {
    '@opentiny/vue-common': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-common.mjs`,
    '@opentiny/vue-locale': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-locale.mjs`
  }
}

export const importMap = {
  imports: {
    vue: `${VITE_CDN_DOMAIN}/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.prod.js`,
    'vue-i18n': `${VITE_CDN_DOMAIN}/vue-i18n@9.2.0-beta.36/dist/vue-i18n.esm-browser.js`,
    ...blockRequire.imports,
    ...tinyVueRequire.imports
  }
}

export const importStyles = [...blockRequire.importStyles]
