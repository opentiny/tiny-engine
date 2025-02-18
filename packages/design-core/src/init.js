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
import i18n from '@opentiny/tiny-engine-common/js/i18n'
import { initMonitor } from '@opentiny/tiny-engine-common/js/monitor'
import { injectGlobalComponents, setGlobalMonacoEditorTheme, Modal, Notify } from '@opentiny/tiny-engine-common'
import TinyThemeTool from '@opentiny/vue-theme/theme-tool'
import { defaultThemeList } from '@opentiny/tiny-engine-theme-base'
import {
  defineEntry,
  mergeRegistry,
  getMergeMeta,
  getMetaApi,
  META_SERVICE,
  initServices,
  initHook,
  HOOK_NAME,
  useMessage
} from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import App from './App.vue'
import defaultRegistry from '../registry.js'
import { registerConfigurators } from './registerConfigurators'

const { guid } = utils

const defaultLifeCycles = {
  beforeAppCreate: ({ registry }) => {
    // 合并用户自定义注册表
    const newRegistry = mergeRegistry(registry, defaultRegistry)
    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    if (process.env.NODE_ENV === 'development') {
      console.log('default registry:', defaultRegistry) // eslint-disable-line
      console.log('merged registry:', registry) // eslint-disable-line
    }

    // 在common层注入合并后的注册表
    defineEntry(newRegistry)

    // 初始化所有服务
    initServices()

    initHook(HOOK_NAME.useEnv, import.meta.env)
    initHook(HOOK_NAME.useNotify, Notify, { useDefaultExport: true })
    initHook(HOOK_NAME.useModal, Modal)

    // 加载主题样式，尽早加载
    // import(`./theme/${newRegistry.config.theme}.js`)

    const theme = localStorage.getItem(`tiny-engine-theme-${appId}`) || newRegistry.config.theme || 'light'
    // eslint-disable-next-line no-new
    new TinyThemeTool(defaultThemeList[theme], defaultThemeList[theme]?.id)
    document.documentElement?.setAttribute?.('data-theme', theme)

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

    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    const theme = localStorage.getItem(`tiny-engine-theme-${appId}`) || getMergeMeta('engine.config').theme
    const editorTheme = theme?.includes('dark') ? 'vs-dark' : 'vs'
    setGlobalMonacoEditorTheme(editorTheme)
  }
}

const subscribeSignalFinish = (createAppSignal, timeout = 30000) => {
  return new Promise((resolve, reject) => {
    let finishCount = new Set()
    const len = new Set(createAppSignal).size

    const signalTopicAndSubscriber = createAppSignal.map((name) => ({
      topic: name,
      subscriber: `createAppSignal_${name}_${guid}`
    }))

    const initTimeout = setTimeout(() => {
      // 取消订阅
      signalTopicAndSubscriber.forEach(({ topic, subscriber }) => {
        useMessage().unsubscribe({
          topic,
          subscriber
        })
      })

      reject(new Error(`Signal initialization timeout after ${Math.floor(timeout / 1000)}s.`))
    }, timeout)

    signalTopicAndSubscriber.forEach(({ topic, subscriber }) => {
      useMessage().subscribe({
        topic,
        subscriber,
        callback: () => {
          finishCount.add(topic)

          // 取消订阅
          useMessage().unsubscribe({
            topic,
            subscriber
          })

          if (finishCount.size === len) {
            clearTimeout(initTimeout)
            resolve()
          }
        }
      })
    })
  })
}

export const init = async ({
  selector = '#app',
  registry = defaultRegistry,
  lifeCycles = {},
  configurators = {},
  createAppSignal = [],
  initTimeout = 30000
} = {}) => {
  const { beforeAppCreate, appCreated, appMounted } = lifeCycles

  registerConfigurators(configurators)

  defaultLifeCycles.beforeAppCreate({ registry })
  beforeAppCreate?.({ registry })

  if (Array.isArray(createAppSignal) && createAppSignal.length) {
    if (typeof initTimeout !== 'number' || initTimeout <= 0) {
      throw new Error('initTimeout must be a positive number')
    }
    await subscribeSignalFinish(createAppSignal, initTimeout)
  }

  const app = createApp(App)
  defaultLifeCycles.appCreated({ app })
  appCreated?.({ app })

  app.mount(selector)
  appMounted?.({ app })
}
