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

import { createApp } from 'vue'
import { useAppSchema } from './src/composables/useAppSchema'
import { createAppRouter } from './src/router'
import { createPinia } from 'pinia'
import { createStores, generateStoresConfig } from './src/stores'
import App from './src/App.vue'
import i18n from '@opentiny/tiny-engine-i18n-host'

// 初始化运行时渲染器
export const initRuntimeRenderer = async () => {
  const searchParams = new URLSearchParams(location.search)
  const appId = searchParams.get('id')
  const { fetchAppSchema, fetchBlocks } = useAppSchema()
  await fetchAppSchema(appId || '')
  await fetchBlocks()
  const router = await createAppRouter()

  const pinia = createPinia()
  const storesConfig = generateStoresConfig()
  const stores = createStores(storesConfig, pinia)

  const app = createApp(App)
  app.use(pinia).use(router).use(i18n).mount('#app')

  app.provide('stores', stores)
  return app
}
