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

import { shallowReactive } from 'vue'

export function useContext() {
  const context = shallowReactive({})
  const setContext = (ctx, clear) => {
    clear && Object.keys(context).forEach((key) => delete context[key])
    Object.assign(context, ctx)
  }

  const getContext = () => context

  return {
    context,
    setContext,
    getContext
  }
}

export function useCondition() {
  // 从大纲树控制隐藏
  const conditions = shallowReactive({})
  const setCondition = (id, visible = false) => {
    conditions[id] = visible
  }
  const getCondition = (id) => conditions[id] !== false

  const getConditions = () => conditions
  return {
    conditions,
    setCondition,
    getCondition,
    getConditions
  }
}

export function usePageContextParent() {
  let contextParent = null
  function setContextParent(parent: any) {
    contextParent = parent
  }
  function getContextParent() {
    return contextParent
  }
  return {
    setContextParent,
    getContextParent
  }
}

export function useCssScopeId() {
  let cssScopeId = null
  function setCssScopeId(id: string) {
    cssScopeId = id
  }
  function getCssScopeId() {
    return cssScopeId
  }
  return {
    getCssScopeId,
    setCssScopeId
  }
}
export function usePageContext() {
  const contextExpose = useContext()
  const conditionExpose = useCondition()
  const contextParentExpose = usePageContextParent()
  const cssCopeIdExpose = useCssScopeId()
  return {
    ...contextExpose,
    ...conditionExpose,
    ...contextParentExpose,
    ...cssCopeIdExpose,
    pageId: '',
    active: false
  }
}
export type IPageContext = ReturnType<typeof usePageContext>
