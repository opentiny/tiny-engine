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
import { api } from './RenderMain'
import { generateFn, globalNotify } from './render'
import { context as renderContext } from './context'

export const lowcodeWrap = (props, context) => {
  const global = {}
  const instance = getCurrentInstance()
  const router = ''
  const route = ''
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
    route: { get: () => route },
    i18n: { get: () => t },
    getLocale: { get: () => getLocale },
    setLocale: { get: () => setLocale },
    location: { get: location },
    history: { get: history },
    utils: {
      get: api.getUtils
    },
    bridge: { get: () => ({}) },
    dataSourceMap: { get: api.getDataSourceMap },
    $: { get: () => ref }
  })

  const wrap = (fn) => {
    if (typeof fn === 'function') {
      const fnString = fn.toString()

      if (fnString.includes('return this')) {
        return () => global
      } else if (/this\.dataSourceMap\.[0-9a-zA-Z_]+\.load\(\)/.test(fnString)) {
        return generateFn(fn, renderContext)
      } else if (fn.name === 'setter' || fn.name === 'getter') {
        // 这里需要保证在消费区块时，区块中的访问器函数可以正常执行
        return (...args) => {
          try {
            fn.apply(global, args)
          } catch (error) {
            globalNotify({
              type: 'warning',
              title: `访问器函数:${fn.name}执行报错`,
              message: error?.message || `访问器函数:${fn.name}执行报错，请检查语法`
            })
          }
        }
      } else {
        return () => Promise.resolve({ result: [], page: { total: 100 } })
      }
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
  return { t: i18n.global.t, lowcodeWrap }
}
