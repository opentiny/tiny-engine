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
import { merge } from 'lodash-es'
import initSvgs from '@opentiny/tiny-engine-svgs'
import { setGlobalConfig } from '@opentiny/tiny-engine-controller'
import i18n from '@opentiny/tiny-engine-controller/js/i18n'
import globalConfig from '../config/lowcode.config'
import { initMonitor } from '@opentiny/tiny-engine-controller/js/monitor'
import { injectGlobalComponents } from '@opentiny/tiny-engine-common'
import { initHttp } from '@opentiny/tiny-engine-http'
import TinyThemeTool from '@opentiny/vue-theme/theme-tool'
import { tinySmbTheme } from '@opentiny/vue-theme/theme' // SMB 主题
import { defineEntry } from '@opentiny/tiny-engine-entry'
import App from './App.vue'
import defaultRegistry from '../registry.js'

import 'virtual:svg-icons-register'

const type = (obj) => {
  return Object.prototype.toString.call(obj).match(/\[object (.*)\]/)[1]
}

const mergeRegistry = (registry) => {
  Object.entries(registry).forEach(([key, value]) => {
    const defaultConfig = defaultRegistry[key]
    if (Array.isArray(value) && defaultConfig) {
      value.forEach((meta, index) => {
        const defaultMeta = defaultConfig.find((item) => item.id === meta.id)
        if (defaultMeta) {
          value[index] = merge(defaultMeta, meta)
        }
      })
    }

    if (type(value) === 'Object' && defaultConfig) {
      registry[key] = merge(defaultConfig, registry[key])
    }
  })
  console.log('default registry:', defaultRegistry)
  console.log('merged registry:', registry)
  return registry
}

const beforeAppCreate = ({ selector, registry }) => {
  // 合并用户自定义注册表
  const newRegistry = mergeRegistry(registry)

  // 在common层注入合并后的注册表
  defineEntry(newRegistry)

  initHttp({ env: import.meta.env })

  // eslint-disable-next-line no-new
  new TinyThemeTool(tinySmbTheme, 'smbtheme') // 初始化主题

  if (import.meta.env.VITE_ERROR_MONITOR === 'true' && import.meta.env.VITE_ERROR_MONITOR_URL) {
    initMonitor(import.meta.env.VITE_ERROR_MONITOR_URL)
  }

  window.TinyGlobalConfig = globalConfig
  setGlobalConfig(globalConfig)
}

const appCreated = (app) => {
    initSvgs(app)
    window.lowcodeI18n = i18n
    app.use(i18n).use(injectGlobalComponents)
}

const beforeAppMounted = (app) => {

}

const appMounted = (app) => {

}

export const init = (selector = '#app', registry = defaultRegistry) => {
  beforeAppCreate({ selector, registry })
  const app = createApp(App)
  appCreated(app)
  beforeAppMounted(app)
  app.mount(selector)
  appMounted(app)
}
