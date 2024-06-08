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
import { initMonitor } from '@opentiny/tiny-engine-controller/js/monitor'
import { injectGlobalComponents } from '@opentiny/tiny-engine-common'
import { initHttp } from '@opentiny/tiny-engine-http'
import TinyThemeTool from '@opentiny/vue-theme/theme-tool'
import { tinySmbTheme } from '@opentiny/vue-theme/theme' // SMB 主题
import { defineEntry, mergeRegistry } from '@opentiny/tiny-engine-entry'
import App from './layout/App.vue'
import defaultRegistry from '../registry.js'
import { registerConfigurators } from './registerConfigurators'

const defaultLifeCycles = {
  beforeAppCreate: ({ registry }) => {
    // 合并用户自定义注册表
    const newRegistry = mergeRegistry(registry, defaultRegistry)
    if (process.env.NODE_ENV === 'development') {
      console.log('default registry:', defaultRegistry) // eslint-disable-line
      console.log('merged registry:', registry) // eslint-disable-line
    }

    // 在common层注入合并后的注册表
    defineEntry(newRegistry)

    // 加载主题样式，尽早加载
    // import(`./theme/${newRegistry.config.theme}.js`)

    initHttp({ env: import.meta.env })

    // eslint-disable-next-line no-new
    new TinyThemeTool(tinySmbTheme, 'smbtheme') // 初始化主题

    if (import.meta.env.VITE_ERROR_MONITOR === 'true' && import.meta.env.VITE_ERROR_MONITOR_URL) {
      initMonitor(import.meta.env.VITE_ERROR_MONITOR_URL)
    }

    // 这里暴露到 window 是为了让 canvas 可以读取
    window.TinyGlobalConfig = newRegistry.config || {}
  },
  appCreated: ({ app }) => {
    initSvgs(app)
    window.lowcodeI18n = i18n
    app.use(i18n).use(injectGlobalComponents)
  }
}

export const init = ({ selector = '#app', registry = defaultRegistry, lifeCycles = {}, configurators = [] } = {}) => {
  const { beforeAppCreate, appCreated, appMounted } = lifeCycles

  registerConfigurators(configurators)

  defaultLifeCycles.beforeAppCreate({ registry })
  beforeAppCreate?.({ registry })
  const app = createApp(App)
  defaultLifeCycles.appCreated({ app })
  appCreated?.({ app })

  app.mount(selector)
  appMounted?.({ app })
}
