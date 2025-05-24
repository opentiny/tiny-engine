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
import { isRef } from 'vue'
import { merge } from 'lodash-es'
import { initHook } from './hooks'

export const metaHashMap: Map<string, any> = new Map()
export const apisMap: Record<string, any> = {}
export const optionsMap: Record<string, any> = {}

export const getMetaApi = (id: string, key?: string) => {
  if (!apisMap[id]) {
    return
  }

  if (key) {
    return apisMap[id][key]
  }

  return apisMap[id]
}

export const getOptions = (id: string) => {
  return optionsMap[id]
}

export const preprocessRegistry = (registry: Array<any> | { [s: string]: any }) => {
  // 元应用支持使用长度为2的数组来配置，第一个参数为元应用，第二个参数是额外的自定义配置。此函数判断数组是否属于这种配置格式
  const isArrayFormat = (arr: any) => Array.isArray(arr) && arr.length === 2 && arr[0].id

  Object.values(registry)
    .filter((metaApps) => Array.isArray(metaApps))
    .forEach((metaApps) => {
      // normal: { plugins: [ Page, Block, ... ] }
      // array format: { plugins: [ [ Page, { options: extraOptions } ], Block, ... ] }
      metaApps.forEach((metaApp: any, index: number) => {
        if (isArrayFormat(metaApp)) {
          metaApps.splice(index, 1, { ...metaApp[0], ...metaApp[1] })
        }
      })
    })
}

export const getMergeMeta = (id: string) => {
  return metaHashMap.get(id)
}

export const getMergeMetaByType = (type: string) => {
  const result: Record<string, any> = []

  for (const [_key, value] of metaHashMap) {
    if (value.type === type) {
      result.push(value)
    }
  }

  return result
}

export const getAllMergeMeta = () => {
  return Array.from(metaHashMap.values())
}

const registryApiAndOptionsMap = (id: string, value: any) => {
  const { apis, options, composable } = value || {}

  if (apis) {
    apisMap[id] = apis
    if (composable?.name) {
      initHook(composable.name, apis)
    }
  }

  if (options) {
    optionsMap[id] = options
  }
}

const genDefaultHashMap = (registry: any) => {
  Object.entries(registry).forEach(([key, value]) => {
    if (typeof value === 'object' && value && !isRef(value)) {
      const { id } = value
      // 如果匹配到了id，说明是元服务配置，对元服务配置做读取和写入
      if (id && key !== 'metaData') {
        registryApiAndOptionsMap(id, value)
        metaHashMap.set(id, value)
      }

      genDefaultHashMap(value)
    }
  })
}

export const mergeRegistry = (defaultRegistry: Record<string, any>, ...registry: Record<string, any>[]) => {
  // 默认的注册表，生成默认的 metaHashMap
  genDefaultHashMap(defaultRegistry)

  registry.forEach((item) => {
    if (!item || Object.prototype.toString.call(item) !== '[object Object]') {
      return
    }

    Object.entries(item).forEach(([key, value]) => {
      const defaultRegistryItem = metaHashMap.get(key)
      // 删除默认插件
      if (defaultRegistryItem && !value) {
        metaHashMap.delete(key)
        return
      }

      // 新增插件
      if (!defaultRegistryItem && value) {
        metaHashMap.set(key, value)
        registryApiAndOptionsMap(key, value)
        return
      }

      // 配置插件
      if (defaultRegistryItem && value) {
        const mergedRegistryItem = merge({}, defaultRegistryItem, value)
        metaHashMap.set(key, mergedRegistryItem)
        registryApiAndOptionsMap(key, mergedRegistryItem)
      }
    })
  })
}
