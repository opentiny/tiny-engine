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

import { nextTick, inject } from 'vue'
import { getCSSHandler } from './css-handler.ts'
import { parseData } from '../parser/parser.ts'
import { useState } from './state.ts'
import useContext from '../useContext.ts'
import type { PageContent as Schema } from '../../types/schema.ts'
import dataSourceMap from '../../app-function/dataSource.js'
import { getUtilsAll } from '../../app-function/utils.ts'

// 创建 context 实例的工厂函数
export const createBlockContext = () => {
  const { context, setContext, getContext } = useContext()
  const stores = inject('stores')
  const methods: Record<string, any> = {}
  const { state, setState } = useState({ getContext })

  const setMethods = (data: Record<string, any> = {}, clear?: boolean) => {
    if (clear) {
      Object.keys(methods).forEach((key) => delete methods[key])
    }
    Object.assign(
      methods,
      Object.fromEntries(
        Object.keys(data).map((key) => {
          return [key, parseData(data[key], {}, getContext())]
        })
      )
    )
    setContext(methods)
  }

  const setSchema = async (data: Schema) => {
    if (!data) return

    const newSchema = JSON.parse(JSON.stringify(data))

    const contextData = {
      state,
      stores,
      dataSourceMap,
      utils: getUtilsAll()
    }
    setContext(contextData, true)
    setMethods(newSchema.methods, true)
    setState(newSchema.state, true)
    await nextTick()

    const cssHandler = getCSSHandler({ enableScoped: true })
    cssHandler.setPageCss(data.css || '', `block-${data.fileName || 'unknown'}`)

    return context
  }

  return {
    setSchema,
    getContext: () => context
  }
}

// 暂时不写成异步函数形式，方便后续调用
export const getBlockContext = (schema: Schema) => {
  const blockContext = createBlockContext()
  blockContext.setSchema(schema)
  return blockContext.getContext()
}
