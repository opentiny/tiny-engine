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

  if (!appId) {
    throw new Error('Missing required "id" query parameter')
  }

  const { fetchAppSchema, fetchBlocks } = useAppSchema()
  await fetchAppSchema(appId)
  await fetchBlocks()
  const router = await createAppRouter()

  const pinia = createPinia()
  const storesConfig = generateStoresConfig()
  const stores = createStores(storesConfig, pinia)

  const app = createApp(App)
  app.provide('stores', stores)

  // 全局错误处理（防止 scheduler 被打断）
  app.config.errorHandler = (err, instance, info) => {
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', err, info)
    if ((err as any)?.stack) {
      // eslint-disable-next-line no-console
      console.error('[GlobalErrorHandler stack]', (err as any).stack)
    }
  }

  app.use(pinia).use(router).use(i18n)

  // 等待设计器页面导航完成后再挂载应用
  if (router.navigateToDesignerPage) {
    await router.navigateToDesignerPage
  }

  app.mount('#app')

  return app
}
