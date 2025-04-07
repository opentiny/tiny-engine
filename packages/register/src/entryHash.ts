/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { merge } from 'lodash-es'
import { generateRegistry, entryHashMap, preprocessRegistry, metaHashMap } from './common'

export const mergeRegistry = (registry: Record<string, any>) => {
  if (!registry || Object.prototype.toString.call(registry) !== '[object Object]') {
    return
  }

  Object.entries(registry).forEach(([key, value]) => {
    const defaultRegistryItem = metaHashMap.get(key)
    // 取消注册插件
    if (!defaultRegistryItem && value) {
      metaHashMap.set(key, value)
      return
    }
    if (defaultRegistryItem && !value) {
      metaHashMap.delete(key)
      return
    }
    if (defaultRegistryItem && value) {
      const mergedRegistryItem = merge({}, defaultRegistryItem, value)
      metaHashMap.set(key, mergedRegistryItem)
    }
  })
}

export const defineEntry = (registry: any) => {
  if (!registry) {
    throw new Error('请传递正确的注册表')
  }

  preprocessRegistry(registry)
  generateRegistry(registry)
}

export const callEntry = (fn, params) => {
  const { metaData, ctx } = params
  const customMethod = entryHashMap[metaData?.id]
  if (customMethod) {
    const customFn = customMethod.entry ? customMethod.entry : customMethod
    if (typeof customFn === 'function') {
      return customFn(ctx, fn)
    }
  }

  return fn
}

export const beforeCallEntry = ({ metaData, ctx }) => {
  const id = metaData?.id

  const customMethod = entryHashMap[id]?.before
  if (customMethod) {
    customMethod(ctx)
  }
}

export const afterCallEntry = ({ metaData, ctx }) => {
  const id = metaData?.id
  const customMethod = entryHashMap[id]?.after
  if (customMethod) {
    customMethod(ctx)
  }
}
