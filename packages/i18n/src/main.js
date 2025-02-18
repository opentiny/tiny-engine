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
import App from './App.vue'
import i18n from './lib'

i18n.global.mergeLocaleMessage('en_US', { hello: 'Hello!' })
i18n.global.mergeLocaleMessage('zh_CN', { hello: '你好！' })

// use(i18n) 可以让 app 内的 vue 组件使用 useI18n
createApp(App).use(i18n).mount('#app')
