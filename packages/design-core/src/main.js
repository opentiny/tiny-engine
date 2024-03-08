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
import { setGlobalConfig } from '@opentiny/tiny-engine-controller'
import i18n from '@opentiny/tiny-engine-controller/js/i18n'
import App from './App.vue'
import globalConfig from '../config/lowcode.config'
import { initMonitor } from '@opentiny/tiny-engine-controller/js/monitor'
import { isDevelopEnv } from '@opentiny/tiny-engine-controller/js/environments'
import { injectGlobalComponents } from '@opentiny/tiny-engine-common'
import { initHttp } from '@opentiny/tiny-engine-http'
import 'virtual:svg-icons-register'

import TinyThemeTool from '@opentiny/vue-theme/theme-tool'
import { tinySmbTheme } from '@opentiny/vue-theme/theme' // SMB 主题

initHttp({ env: import.meta.env })

// eslint-disable-next-line no-new
new TinyThemeTool(tinySmbTheme, 'smbtheme') // 初始化主题

if (!isDevelopEnv) {
  initMonitor()
}

window.TinyGlobalConfig = globalConfig
setGlobalConfig(globalConfig)

const app = createApp(App)

initSvgs(app)
window.lowcodeI18n = i18n
app.use(i18n).use(injectGlobalComponents).mount('#app')
