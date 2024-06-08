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
import { defineEntry, mergeRegistry } from '@opentiny/tiny-engine-entry'
import defaultRegistry from '../../../registry.js'
import App from './App.vue'
import 'virtual:svg-icons-register'

export const initPreview = ({ registry }) => {
  const mergedRegistry = mergeRegistry(registry, defaultRegistry)
  defineEntry(mergedRegistry)

  import(`../../theme/${mergedRegistry.config.theme || 'light'}.js`)

  const app = createApp(App)

  initSvgs(app)

  app.mount('#app')
}
