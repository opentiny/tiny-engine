/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

// import { hyphenate } from '@vue/shared'

import { getSearchParams } from './http'
import { VITE_CDN_DOMAIN } from '@opentiny/tiny-engine-common/js/environments'

const importMap = {}

const opentinyVueVersion = '~3.11'

const tinyVue3Imports = {
  // 推荐之后统一使用@opentiny/vue去引入依赖，兼容后续录入的组件来源于tiny-vue
  '@opentiny/vue': `${VITE_CDN_DOMAIN}/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue.mjs`,
  '@opentiny/vue-icon': `${VITE_CDN_DOMAIN}/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue-icon.mjs`,
  '@opentiny/vue-common': `${VITE_CDN_DOMAIN}/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue-common.mjs`,
  '@opentiny/vue-locale': `${VITE_CDN_DOMAIN}/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue-locale.mjs`,
  '@opentiny/vue-renderless/': `${VITE_CDN_DOMAIN}/@opentiny/vue-renderless@${opentinyVueVersion}/`
}

importMap.imports = {
  vue: `${VITE_CDN_DOMAIN}/vue@3.2.36/dist/vue.runtime.esm-browser.js`,
  'vue/server-renderer': `${VITE_CDN_DOMAIN}/@vue/server-renderer@3.2.36/dist/server-renderer.esm-browser.js`,
  'vue-i18n': `${VITE_CDN_DOMAIN}/vue-i18n@9.2.0-beta.36/dist/vue-i18n.esm-browser.js`,
  'vue-router': `${VITE_CDN_DOMAIN}/vue-router@4.0.16/dist/vue-router.esm-browser.js`,
  '@vue/devtools-api': `${VITE_CDN_DOMAIN}/@vue/devtools-api@6.5.1/lib/esm/index.js`,
  '@vueuse/core': `${VITE_CDN_DOMAIN}/@vueuse/core@9.6.0/index.mjs`,
  '@vueuse/shared': `${VITE_CDN_DOMAIN}/@vueuse/shared@9.6.0/index.mjs`,
  axios: `${VITE_CDN_DOMAIN}/axios@1.0.0-alpha.1/dist/esm/axios.js`,
  'axios-mock-adapter': `${VITE_CDN_DOMAIN}/axios-mock-adapter@1.21.1/dist/axios-mock-adapter.js`,
  '@opentiny/tiny-engine-webcomponent-core': `${VITE_CDN_DOMAIN}/@opentiny/tiny-engine-webcomponent-core@1/dist/tiny-engine-webcomponent-core.es.js`,
  '@opentiny/tiny-engine-i18n-host': `${VITE_CDN_DOMAIN}/@opentiny/tiny-engine-i18n-host@1/dist/tiny-engine-i18n-host.es.js`,
  'vue-demi': `${VITE_CDN_DOMAIN}/vue-demi@0.13.11/lib/index.mjs`,
  pinia: `${VITE_CDN_DOMAIN}/pinia@2.0.22/dist/pinia.esm-browser.js`,
  ...tinyVue3Imports,
  ...getSearchParams().scripts
}

export default importMap
