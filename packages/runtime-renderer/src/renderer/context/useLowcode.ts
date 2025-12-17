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

import { useRouter, useRoute } from 'vue-router'
import { getStore, getDataSource, getUtilsAll } from './index'
import { getCurrentInstance, nextTick, provide, inject } from 'vue'
import TinyI18nHost, { I18nInjectionKey } from '@opentiny/tiny-engine-common/js/i18n'

export const lowcodeWrap = (props: any, context: any) => {
  const global: any = {}
  const instance = getCurrentInstance() as any
  const router = useRouter()
  const route = useRoute()
  const i18nhost = inject(I18nInjectionKey) as any
  const { t, locale } = i18nhost.global
  const emit = context.emit
  const ref = (ref: string) => instance?.refs?.[ref]

  const setState = (newState: any, callback: any) => {
    Object.assign(global.state, newState)
    nextTick(() => callback.apply(global))
  }

  const getLocale = () => locale.value
  const setLocale = (val: string) => {
    locale.value = val
  }

  const location = () => window.location
  const history = () => window.history

  Object.defineProperties(global, {
    i18n: { get: () => t },
    emit: { get: () => emit },
    props: { get: () => props },
    route: { get: () => route },
    router: { get: () => router },
    setState: { get: () => setState },
    getLocale: { get: () => getLocale },
    setLocale: { get: () => setLocale },
    utils: { get: () => getUtilsAll() },
    dataSourceMap: { get: () => getDataSource() },
    location: { get: location },
    history: { get: history },
    bridge: { get: () => {} },
    $: { get: () => ref }
  })

  const wrap = (fn: any) => {
    if (typeof fn === 'function') {
      return (...args: any[]) => fn.apply(global, args)
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

export const lowcode = () => {
  const i18n = inject(I18nInjectionKey) as any

  provide(I18nInjectionKey, i18n)

  return { t: i18n.global.t, lowcodeWrap, stores: getStore() }
}

export const useLowcode = () => {
  const i18nHost = TinyI18nHost as any
  i18nHost.lowcode = lowcode
  return {
    TinyI18nHost: i18nHost
  }
}
