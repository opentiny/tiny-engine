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
import defaultConfig from './config'
import { createAppRouter, createAppStores } from './src/renderer/app-function'
import { useAppSchema } from './src/composables/useAppSchema'
import i18n from '@opentiny/tiny-engine-common/js/i18n'
import App from './src/App.vue'

// 初始化运行时渲染器
export const initRuntimeRenderer = async (config: any) => {
  Object.assign(defaultConfig, config || {})
  const searchParams = new URLSearchParams(location.search)
  const appId = searchParams.get('id')
  if (!appId) {
    throw new Error('Missing required "id" query parameter')
  }
  const { initAppData } = useAppSchema()
  await initAppData(appId)
  const router = createAppRouter()
  const pinia = createAppStores()
  const app = createApp(App)
  app.use(pinia).use(i18n).use(router).mount('#app')
  // 全局错误处理（防止 scheduler 被打断）
  app.config.errorHandler = (err, _instance, info) => {
    // eslint-disable-next-line no-console
    console.error(err, _instance, info)
  }
}
