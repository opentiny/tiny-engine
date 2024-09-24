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

import { createApp, h } from 'vue'
import { addScript, addStyle, dynamicImportComponents, updateDependencies } from '../../common'
import TinyI18nHost, { I18nInjectionKey } from '@opentiny/tiny-engine-common/js/i18n'
import Main, { api } from './RenderMain'
import lowcode from './lowcode'
import { supportUmdBlock } from './supportUmdBlock'

const dispatch = (name, data) => {
  window.parent.document.dispatchEvent(new CustomEvent(name, data))
}

const initRenderContext = () => {
  dispatch('beforeCanvasReady')

  TinyI18nHost.lowcode = lowcode

  window.TinyLowcodeComponent = {}
  window.TinyComponentLibs = {}

  supportUmdBlock()

  document.addEventListener('updateDependencies', updateDependencies)
}

let App = null

const renderer = {
  getApp() {
    return App
  },
  getI18n() {
    return TinyI18nHost
  },
  ...api
}

const create = async (config) => {
  const { beforeAppCreate, appCreated } = config.lifeCycles || {}
  if (typeof beforeAppCreate === 'function') {
    await beforeAppCreate({ Vue: { h }, canvasWin: window, api })
  }
  App && App.unmount()
  App = null

  document.body.remove()
  document.body = document.createElement('body')
  const app = document.createElement('div')
  app.setAttribute('id', 'app')
  document.body.appendChild(app)

  dispatch('canvasReady', { detail: renderer })

  App = createApp(Main).use(TinyI18nHost).provide(I18nInjectionKey, TinyI18nHost)

  if (typeof appCreated === 'function') {
    await appCreated(App)
  }

  App.config.globalProperties.lowcodeConfig = window.parent.TinyGlobalConfig
  App.mount(document.querySelector('#app'))

  new ResizeObserver(() => {
    dispatch('canvasResize')
  }).observe(document.body)

  App.config.errorHandler = () => {}
}

export const createRender = (config) => {
  initRenderContext()

  const { styles = [], scripts = [] } = config.canvasDependencies
  const { styles: thirdStyles = [], scripts: thirdScripts = [] } = window.thirdPartyDeps || {}

  Promise.all([
    ...thirdScripts.map(dynamicImportComponents),
    ...scripts.map((src) => addScript(src)).concat([...thirdStyles, ...styles].map((src) => addStyle(src)))
  ]).finally(() => create(config))
}
