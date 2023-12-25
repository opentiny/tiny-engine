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

const opentinyVueVersion = '~3.11'

const tinyVue3Imports = {
  // 推荐之后统一使用@opentiny/vue去引入依赖，兼容后续录入的组件来源于tiny-vue
  '@opentiny/vue': `https://npm.onmicrosoft.cn/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue.mjs`,
  '@opentiny/vue-icon': `https://npm.onmicrosoft.cn/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue-icon.mjs`,
  '@opentiny/vue-common': `https://npm.onmicrosoft.cn/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue-common.mjs`,
  '@opentiny/vue-locale': `https://npm.onmicrosoft.cn/@opentiny/vue@${opentinyVueVersion}/runtime/tiny-vue-locale.mjs`,
  '@opentiny/vue-renderless/': `https://npm.onmicrosoft.cn/@opentiny/vue-renderless@${opentinyVueVersion}/`
}

importMap.imports = {
  vue: 'https://npm.onmicrosoft.cn/vue@3.2.36/dist/vue.runtime.esm-browser.js',
  'vue/server-renderer': 'https://npm.onmicrosoft.cn/@vue/server-renderer@3.2.36/dist/server-renderer.esm-browser.js',
  'vue-i18n': 'https://npm.onmicrosoft.cn/vue-i18n@9.2.0-beta.36/dist/vue-i18n.esm-browser.js',
  'vue-router': 'https://npm.onmicrosoft.cn/vue-router@4.0.16/dist/vue-router.esm-browser.js',
  '@vue/devtools-api': 'https://npm.onmicrosoft.cn/@vue/devtools-api@6.1.4/lib/esm/index.js',
  '@vueuse/core': 'https://npm.onmicrosoft.cn/@vueuse/core@9.6.0/index.mjs',
  '@vueuse/shared': 'https://npm.onmicrosoft.cn/@vueuse/shared@9.6.0/index.mjs',
  axios: 'https://npm.onmicrosoft.cn/axios@1.0.0-alpha.1/dist/esm/axios.js',
  'axios-mock-adapter': 'https://npm.onmicrosoft.cn/axios-mock-adapter@1.21.1/dist/axios-mock-adapter.js',
  '@opentiny/tiny-engine-webcomponent-core':
    'https://npm.onmicrosoft.cn/@opentiny/tiny-engine-webcomponent-core@1/dist/tiny-engine-webcomponent-core.es.js',
  '@opentiny/tiny-engine-i18n-host':
    'https://npm.onmicrosoft.cn/@opentiny/tiny-engine-i18n-host@1/dist/tiny-engine-i18n-host.es.js',
  'vue-demi': 'https://npm.onmicrosoft.cn/vue-demi@0.13.11/lib/index.mjs',
  pinia: 'https://npm.onmicrosoft.cn/pinia@2.0.22/dist/pinia.esm-browser.js',
  ...tinyVue3Imports,
  ...getSearchParams().scripts
}

export default importMap
