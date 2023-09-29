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

import { getCurrentInstance, nextTick, provide, inject } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import dataSourceMap from './dataSourceMap.js'
import * as utils from './utils.js'
import * as bridge from './bridge.js'
import { useStores } from './storesHelper.js'
import { Modal } from '@opentiny/vue'

export const lowcodeWrap = (props, context) => {
  const global = {}
  const instance = getCurrentInstance()
  const router = new Proxy(
    {},
    {
      get() {
        Modal.alert('页面和区块预览不支持路由操作，请使用应用预览', '提示')
        return () => {}
      }
    }
  )
  const { t, locale } = inject(I18nInjectionKey).global
  const emit = context.emit
  const ref = (ref) => instance.refs[ref]

  const setState = (newState, callback) => {
    Object.assign(global.state, newState)
    nextTick(() => callback?.apply(global))
  }

  const getLocale = () => locale.value
  const setLocale = (val) => {
    locale.value = val
  }

  const location = () => window.location
  const history = () => window.history

  Object.defineProperties(global, {
    props: { get: () => props },
    emit: { get: () => emit },
    setState: { get: () => setState },
    router: { get: () => router },
    i18n: { get: () => t },
    getLocale: { get: () => getLocale },
    setLocale: { get: () => setLocale },
    location: { get: location },
    history: { get: history },
    utils: { get: () => utils },
    bridge: { get: () => bridge },
    dataSourceMap: { get: () => dataSourceMap },
    $: { get: () => ref }
  })

  const wrap = (fn) => {
    if (typeof fn === 'function') {
      return (...args) => fn.apply(global, args)
    }

    Object.entries(fn).forEach(([name, value]) => {
      Object.defineProperty(global, name, {
        get: () => value
      })
    })

    fn.t = t

    return fn
  }

  return wrap
}

export default () => {
  const i18n = inject(I18nInjectionKey)
  provide(I18nInjectionKey, i18n)

  const stores = useStores()

  return { t: i18n.global.t, stores, lowcodeWrap }
}
