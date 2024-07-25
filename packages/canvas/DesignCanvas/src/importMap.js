import { VITE_CDN_DOMAIN } from '@opentiny/tiny-engine-controller/js/environments'

const importMapVersions = {
  vue: '3.4.23',
  tinyVue: '~3.14'
}
export const importMap = {
  imports: {
    vue: `${VITE_CDN_DOMAIN}/vue@${importMapVersions.vue}/dist/vue.runtime.esm-browser.prod.js`,
    'vue-i18n': `${VITE_CDN_DOMAIN}/vue-i18n@9.2.0-beta.36/dist/vue-i18n.esm-browser.js`,
    '@opentiny/vue': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue.mjs`,
    '@opentiny/vue-icon': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-icon.mjs`,
    '@opentiny/vue-common': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-common.mjs`,
    '@opentiny/vue-locale': `${VITE_CDN_DOMAIN}/@opentiny/vue@${importMapVersions.tinyVue}/runtime/tiny-vue-locale.mjs`,
    '@opentiny/vue-renderless/': `${VITE_CDN_DOMAIN}/@opentiny/vue-renderless@${importMapVersions.tinyVue}/`,
    echarts: `${VITE_CDN_DOMAIN}/echarts@5.4.1/dist/echarts.esm.js`
  }
}
