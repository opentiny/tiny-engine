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
import { isRef } from 'vue'
import { initHook } from './hooks'

const vueLifeHook = [
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onActivated',
  'onDeactivated'
]

/**
 * 自定义方法注册哈希表，形式如下：
 * {
 *  'engine.plugins.i18n.handleClick': () => { // do something }
 * }
 */
export const entryHashMap: Record<string, any> = {}
/**
 * 自定义模板注册哈希表，形式如下：
 * {
 *  'engine.plugins.status.metas.app': <template></template>
 * }
 */
export const templateHashMap: Record<string, any> = {}

/**
 * 自定布局hash，形式如下：
 * {
 *  'engine.plugins.status': customLayout
 * }
 */
export const layoutHashMap: Record<string, any> = {}

export const metaHashMap: Record<string, any> = {}

export const apisMap: Record<string, any> = {}
export const optionsMap: Record<string, any> = {}

export const getMetaApi = (id: string, key: string) => {
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

const handleMethods = (id: string, methods: any) => {
  Object.entries(methods).forEach(([fileId, idMethods]) => {
    if (typeof idMethods === 'object' && idMethods) {
      Object.entries(idMethods).forEach(([name, method]) => {
        const prefix = fileId ? `.${fileId}` : ''
        const methodId = `${id}${prefix}.${name}`
        entryHashMap[methodId] = method
      })
    }
  })
}

const handleVueLifeCycle = (id: string, value: any) => {
  for (const hookName of vueLifeHook) {
    const hookConfig = value[hookName]
    if (!hookConfig) {
      return
    }
    if (typeof hookConfig === 'function') {
      const hookId = `${id}.${hookName}[0]`
      entryHashMap[hookId] = hookConfig
    }
    if (Array.isArray(hookConfig)) {
      hookConfig.forEach((hookFn, index) => {
        if (typeof hookFn === 'function') {
          const hookId = `${id}.${hookName}[${index}]`
          entryHashMap[hookId] = hookFn
        }
      })
    }
  }
}

const handleLifeCycles = (id: string, lifeCycles: any) => {
  Object.entries(lifeCycles).forEach(([fileId, idLifeCycles]) => {
    const prefix = fileId ? `.${fileId}` : ''
    const lifeCycleId = `${id}${prefix}`
    handleVueLifeCycle(lifeCycleId, idLifeCycles)
  })
}

const handleRegistryProp = (id: string, value: any) => {
  const { layout, overwrite, apis, options, composable } = value

  if (layout) {
    layoutHashMap[id] = layout
  }

  if (typeof overwrite === 'object' && overwrite) {
    const { template, lifeCycles, methods } = overwrite
    // 处理模板
    if (template) {
      templateHashMap[id] = template
    }
    // 处理生命周期
    if (lifeCycles) {
      handleLifeCycles(id, lifeCycles)
    }
    if (methods) {
      handleMethods(id, methods)
    }
  }

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

export const preprocessRegistry = (registry: Array<any> | { [s: string]: any }) => {
  // 元应用支持使用长度为2的数组来配置，第一个参数为元应用，第二个参数是额外的自定义配置。此函数判断数组是否属于这种配置格式
  const isArrayFormat = (arr) => Array.isArray(arr) && arr.length === 2 && arr[0].id

  Object.values(registry)
    .filter((metaApps) => Array.isArray(metaApps))
    .forEach((metaApps) => {
      // normal: { plugins: [ Page, Block, ... ] }
      // array format: { plugins: [ [ Page, { options: extraOptions } ], Block, ... ] }
      metaApps.forEach((metaApp, index) => {
        if (isArrayFormat(metaApp)) {
          metaApps.splice(index, 1, { ...metaApp[0], ...metaApp[1] })
        }
      })
    })
}

export const generateRegistry = (registry: any) => {
  Object.entries(registry).forEach(([key, value]) => {
    if (typeof value === 'object' && value && !isRef(value)) {
      const { id } = value
      // 如果匹配到了id，说明是元服务配置，对元服务配置做读取和写入
      if (id && key !== 'metaData') {
        handleRegistryProp(id, value)
        metaHashMap[id] = value
      } else {
        // TODO: 其他类型配置处理
      }

      generateRegistry(value)
    }
  })
}

export const getMergeMeta = (id: string) => {
  return metaHashMap[id]
}
