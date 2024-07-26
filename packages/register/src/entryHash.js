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
import { utils } from '@opentiny/tiny-engine-utils'
import { generateRegistry, entryHashMap, preprocessRegistry } from './common'

const lowcodeRegistry = { registry: null }

const { getType } = utils

// 合并子模块注册表(metas字段)
const getMergedChildMetas = (defaultChildMeta, userChildMeta) => {
  if (!Array.isArray(defaultChildMeta)) {
    return userChildMeta
  }

  return userChildMeta.map((childConfig) => {
    const defaultChildConfig = defaultChildMeta.find((item) => item.id === childConfig.id) || {}
    return merge({}, defaultChildConfig, childConfig)
  })
}

/**
 * 合并注册表
 * @param {*} registry 用户自定义的注册表
 * @param {*} defaultRegistry 默认设计器注册表
 * @returns registry 合并后的用户自定义注册表
 */
export const mergeRegistry = (registry, defaultRegistry) => {
  for (const [key, value] of Object.entries(registry)) {
    const defaultConfig = defaultRegistry[key]
    if (Array.isArray(value) && defaultConfig) {
      value.forEach((userMeta, index) => {
        const defaultMeta = defaultConfig.find((item) => item.id === userMeta.id)
        if (defaultMeta) {
          const { metas: defaultChildMeta, ...restMeta } = defaultMeta
          if (Array.isArray(userMeta.metas)) {
            userMeta.metas = getMergedChildMetas(defaultChildMeta, userMeta.metas)
          }
          value[index] = merge({}, restMeta, userMeta)
        }
      })
    }

    if (getType(value) === 'Object' && defaultConfig) {
      registry[key] = merge({}, defaultConfig, registry[key])
    }
  }

  return registry
}

export const getMergeRegistry = (type, id) => {
  const registry = type ? lowcodeRegistry.registry[type] : lowcodeRegistry.registry

  if (!id) {
    return registry
  }

  if (Array.isArray(registry)) {
    const item = registry.find((item) => item.id === id)
    return item || null
  }

  return registry?.[id] ? registry : null
}

export const defineEntry = (registry) => {
  if (!registry) {
    throw new Error('请传递正确的注册表')
  }

  preprocessRegistry(registry)

  lowcodeRegistry.registry = registry
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
