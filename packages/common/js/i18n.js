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

import { createI18n, I18nInjectionKey } from 'vue-i18n'
import i18n, { defineCustomI18n } from '@opentiny/tiny-engine-i18n-host'
import tinyLocale from '@opentiny/vue-locale'
import { i18nKeyMaps } from './constants'

// 此处处理TinyVue组件库的国际化zhCN --> zh_CN
const customCreateI18n = ({ locale, messages }) => {
  const newMessages = {}
  Object.keys(messages).forEach((key) => {
    const lang = i18nKeyMaps[key]
    newMessages[lang] = messages[key]
  })

  return createI18n({
    locale,
    messages: newMessages,
    legacy: false
  })
}

const customI18n = tinyLocale.initI18n({
  i18n: { locale: i18nKeyMaps.zhCN },
  createI18n: customCreateI18n,
  messages: {}
})

// 合并组件库的i18n配置
defineCustomI18n(customI18n)

export { I18nInjectionKey, i18nKeyMaps }

// i18n对象可以多处使用。模板中直接使用$t，setup环境或普通环境中可以引入后使用i18n.global.t
export default i18n
