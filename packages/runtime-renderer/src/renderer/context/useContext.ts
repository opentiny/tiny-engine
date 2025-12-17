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
import * as vue from 'vue'
import { shallowReactive, type ShallowReactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from './useStore.ts'
import { useUtils } from './useUtils.ts'
import { useRefs } from './useRefs.ts'
import { useState } from './useState.ts'
import { useMethods } from './useMethods.ts'
import { useDataSource } from './useDataSource.ts'
import { getDeletedKeys } from '../data-function/index.ts'
import { normalizeScopeKey, setPageCss } from '../page-function/index.ts'
import TinyI18nHost from '@opentiny/tiny-engine-common/js/i18n'
import type { PageContent as Schema } from '../../types/index.ts'

interface Context {
  [key: string]: any
}

interface UseContextReturn {
  context: ShallowReactive<Context>
  setContext: (ctx: Context) => void
  appendContext: (ctx: Context) => void
  getContext: () => ShallowReactive<Context>
}

export function useContext(): UseContextReturn {
  const context = shallowReactive<Context>({})

  const setContext = (ctx: Context) => {
    const deletedKeys = getDeletedKeys(context, ctx)
    deletedKeys?.forEach((key) => delete context[key])
    Object.assign(context, ctx)
  }

  const appendContext = (ctx: Context) => {
    setContext({ ...context, ...ctx })
  }

  const getContext = () => context

  return {
    context,
    setContext,
    getContext,
    appendContext
  }
}

interface InitContextProps {
  schema: Schema
  props: any
  ctx: any
  isBlock?: boolean
}

export function useContextPage() {
  const { context, setContext, appendContext } = useContext()
  const route = useRoute()
  const router = useRouter()
  const { $, $ref } = useRefs()
  const { stores } = useStore()
  const { utils } = useUtils()
  const { dataSourceMap } = useDataSource()
  const { state, setState } = useState({}, context)
  const { methods, setMethods } = useMethods({}, context)
  const { t, locale } = TinyI18nHost.global
  const initContext = ({ schema, props, isBlock, ctx }: InitContextProps, callback?: (...args: any[]) => void) => {
    if (!schema) return
    const cssScopeId = normalizeScopeKey(props.pageId, isBlock)
    setContext({
      ...vue,
      context: ctx,
      t,
      $,
      $ref,
      route,
      router,
      props,
      state,
      utils,
      stores,
      dataSourceMap,
      i18n: { get: () => t },
      // setState: { get: () => setState },
      getLocale: { get: () => locale?.value },
      setLocale: { get: () => (val: string) => (locale.value = val) },
      location: { get: () => window.location },
      history: { get: () => window.history },
      getCssScopeId: () => cssScopeId
    })
    setState(schema.state)
    setMethods(schema.methods)
    appendContext(methods)
    setPageCss(schema.css || '', cssScopeId)
    callback?.()
  }
  return {
    state,
    utils,
    stores,
    context,
    methods,
    initContext,
    setContext,
    appendContext,
    setState,
    setMethods,
    $,
    $ref
  }
}
