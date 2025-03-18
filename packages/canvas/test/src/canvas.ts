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
import * as TinyVue from '@opentiny/vue'

import { RenderMain } from '../src/index'

import { I18nInjectionKey, createI18n } from 'vue-i18n'

window.TinyLowcodeComponent = {}

Object.entries(TinyVue).forEach(([_key, component]) => {
  const { name } = component
  if (name) {
    window.TinyLowcodeComponent[name] = component
  }
})

const i18nHost = createI18n({
  locale: 'zh_CN',
  messages: {}
})

createApp(RenderMain).use(i18nHost).provide(I18nInjectionKey, i18nHost).mount('#app')
