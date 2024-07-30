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

import { reactive } from 'vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { constants } from '@opentiny/tiny-engine-utils'
import { useApp, useTranslate, useEditorInfo } from '@opentiny/tiny-engine-meta-register'

const { DEFAULT_INTERCEPTOR } = constants

const appDataState = reactive({
  dataSource: [],
  pageTree: [],
  langs: {},
  utils: {},
  globalState: [],
  willFetch: {},
  dataHandler: {},
  errorHandler: {},
  bridge: {},
  isDemo: false
})

const initI18n = async () => {
  const { id, type } = useEditorInfo().useInfo()
  try {
    await useTranslate().initI18n({ host: id, hostType: type, init: true })
  } catch (error) {
    console.log(error) // eslint-disable-line
  }
}

const setAppDataState = (appData) => {
  appDataState.pageTree = appData.componentsTree
  appDataState.dataSource = appData.dataSource?.list
  appDataState.dataHandler = appData.dataSource?.dataHandler || DEFAULT_INTERCEPTOR.dataHandler
  appDataState.willFetch = appData.dataSource?.willFetch || DEFAULT_INTERCEPTOR.willFetch
  appDataState.errorHandler = appData.dataSource?.errorHandler || DEFAULT_INTERCEPTOR.errorHandler

  appDataState.bridge = appData.bridge
  appDataState.utils = appData.utils
  appDataState.isDemo = appData.meta?.is_demo
  appDataState.globalState = appData?.meta.global_state

  // 词条语言为空时使用默认的语言
  const defaultLocales = [
    { lang: 'zh_CN', label: 'zh_CN' },
    { lang: 'en_US', label: 'en_US' }
  ]
  const locales = Object.keys(appData.i18n).length
    ? Object.keys(appData.i18n).map((key) => ({ lang: key, label: key }))
    : defaultLocales
  appDataState.langs = {
    locales,
    messages: appData.i18n
  }
}

const fetchAppData = async () => {
  const { id } = useEditorInfo().useInfo()
  useApp().appInfoState.selectedId = id
  return await useHttp().get(`/app-center/v1/api/apps/schema/${id}`)
}

const initAppData = async () => {
  const appData = await fetchAppData()
  setAppDataState(appData)
  await initI18n()

  //TODO： 先返回，等后续有事件通知后，则不采用返回模式，直接使用事件通知
  return appData
}

export default function () {
  return {
    appDataState,
    fetchAppData, // 请求APP全局数据
    initAppData // 初始化APP全局数据
  }
}
