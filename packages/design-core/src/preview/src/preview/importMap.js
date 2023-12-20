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
  '@opentiny/vue': 'https://registry.npmmirror.com/@opentiny/vue/3.11/files/runtime/tiny-vue.mjs',
  '@opentiny/vue-icon': 'https://registry.npmmirror.com/@opentiny/vue/3.11/files/runtime/tiny-vue-icon.mjs',
  '@opentiny/vue-common': 'https://registry.npmmirror.com/@opentiny/vue/3.11/files/runtime/tiny-vue-common.mjs',
  '@opentiny/vue-locale': 'https://registry.npmmirror.com/@opentiny/vue/3.11/files/runtime/tiny-vue-locale.mjs',
  '@opentiny/vue-renderless/': 'https://esm.sh/@opentiny/vue-renderless@3.11/?raw'
}

importMap.imports = {
  vue: 'https://registry.npmmirror.com/vue/3.2.36/files/dist/vue.esm-browser.js',
  'vue/server-renderer':
    'https://registry.npmmirror.com/vue/server-renderer/3.2.36/files/dist/server-renderer.esm-browser.js',
  'vue-i18n': 'https://registry.npmmirror.com/vue-i18n/9.2.0/files/dist/vue-i18n.esm-browser.js',
  'vue-router': 'https://registry.npmmirror.com/vue-router/4.0.16/files/dist/vue-router.esm-browser.js',
  '@vue/devtools-api': 'https://esm.sh/@vue/devtools-api@6.1.4/lib/esm/index.js?raw',
  '@vueuse/core': 'https://registry.npmmirror.com/@vueuse/core/9.6.0/files/index.mjs',
  '@vueuse/shared': 'https://registry.npmmirror.com/@vueuse/shared/9.6.0/files/index.mjs',
  axios: 'https://registry.npmmirror.com/axios/1.0.0-alpha.1/files/dist/esm/axios.js',
  'axios-mock-adapter': 'https://registry.npmmirror.com/axios-mock-adapter/1.21.1/files/dist/axios-mock-adapter.js',
  '@opentiny/tiny-engine-webcomponent-core':
    'https://registry.npmmirror.com/@opentiny/tiny-engine-webcomponent-core/1/files/dist/tiny-engine-webcomponent-core.es.js',
  '@opentiny/tiny-engine-i18n-host':
    'https://registry.npmmirror.com/@opentiny/tiny-engine-i18n-host/1/files/dist/tiny-engine-i18n-host.es.js',
  'vue-demi': 'https://registry.npmmirror.com/vue-demi/0.13.11/files/lib/index.mjs',
  pinia: 'https://registry.npmmirror.com/pinia/2.0.22/files/dist/pinia.esm-browser.js',
  ...tinyVue3Imports,
  ...getSearchParams().scripts
}

export default importMap
