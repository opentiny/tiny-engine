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
import initSvgs from '@opentiny/tiny-engine-svgs'
import { mergeRegistry, initServices } from '@opentiny/tiny-engine-meta-register'
import './styles/vars.less'
import defaultRegistry from './previewDefaultRegistry.js'
import App from './App.vue'

export const initPreview = ({ registry, lifeCycles = {} }) => {
  const { beforeAppCreate } = lifeCycles

  mergeRegistry(defaultRegistry, ...(Array.isArray(registry) ? registry : [registry]))
  beforeAppCreate?.()

  initServices()

  const app = createApp(App)

  initSvgs(app)

  app.mount('#app')
}
