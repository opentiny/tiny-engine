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
import i18n from '@opentiny/tiny-engine-controller/js/i18n'
import 'virtual:svg-icons-register'
import App from './App.vue'

const app = createApp(App)

initSvgs(app)

app.use(i18n).mount('#app')
