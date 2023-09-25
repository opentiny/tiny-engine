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

const importMap = {}

const tinyVue3Imports = {
  // 推荐之后统一使用@opentiny/vue去引入依赖，兼容后续录入的组件来源于tiny-vue
  '@opentiny/vue': 'https://unpkg.com/@opentiny/vue@3/runtime/tiny-vue.mjs',
  '@opentiny/vue-icon': 'https://unpkg.com/@opentiny/vue@3/runtime/tiny-vue-icon.mjs',
  '@opentiny/vue-common': 'https://unpkg.com/@opentiny/vue@3/runtime/tiny-vue-common.mjs',
  '@opentiny/vue-locale': 'https://unpkg.com/@opentiny/vue@3/runtime/tiny-vue-locale.mjs',
  '@opentiny/vue-renderless/': 'https://unpkg.com/@opentiny/vue-renderless@3/'
}

importMap.imports = {
  vue: 'https://unpkg.com/vue@3.2.36/dist/vue.runtime.esm-browser.js',
  'vue/server-renderer': 'https://unpkg.com/@vue/server-renderer@3.2.36/dist/server-renderer.esm-browser.js',
  'vue-i18n': 'https://unpkg.com/vue-i18n@9.2.0-beta.36/dist/vue-i18n.esm-browser.js',
  'vue-router': 'https://unpkg.com/vue-router@4.0.16/dist/vue-router.esm-browser.js',
  '@vue/devtools-api': 'https://unpkg.com/@vue/devtools-api@6.1.4/lib/esm/index.js',
  '@vueuse/core': 'https://unpkg.com/@vueuse/core@9.6.0/index.mjs',
  '@vueuse/shared': 'https://unpkg.com/@vueuse/shared@9.6.0/index.mjs',
  axios: 'https://unpkg.com/axios@1.0.0-alpha.1/dist/esm/axios.js',
  'axios-mock-adapter': 'https://unpkg.com/axios-mock-adapter@1.21.1/dist/axios-mock-adapter.js',
  '@opentiny/tiny-engine-webcomponent-core':
    'https://unpkg.com/@opentiny/tiny-engine-webcomponent-core@1/dist/tiny-engine-webcomponent-core.es.js',
  '@opentiny/tiny-engine-i18n-host':
    'https://unpkg.com/@opentiny/tiny-engine-i18n-host@1/dist/tiny-engine-i18n-host.es.js',
  'vue-demi': 'https://unpkg.com/vue-demi@0.13.11/lib/index.mjs',
  pinia: 'https://unpkg.com/pinia@2.0.22/dist/pinia.esm-browser.js',
  ...tinyVue3Imports,
  ...getSearchParams().scripts
}

export default importMap
