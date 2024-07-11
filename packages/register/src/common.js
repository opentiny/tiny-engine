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
export const entryHashMap = {}
/**
 * 自定义模板注册哈希表，形式如下：
 * {
 *  'engine.plugins.status.metas.app': <template></template>
 * }
 */
export const templateHashMap = {}

/**
 * 自定布局hash，形式如下：
 * {
 *  'engine.plugins.status': customLayout
 * }
 */
export const layoutHashMap = {}

export const metasHashMap = {}

export const apisMap = {}
export const optionsMap = {}

export const getMetaApi = (id, key) => {
  if (!apisMap[id]) {
    return
  }

  if (key) {
    return apisMap[id][key]
  }

  return apisMap[id]
}

export const getOptions = (id) => {
  return optionsMap[id]
}

const handleMethods = (id, methods) => {
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

const handleVueLifeCycle = (id, value) => {
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

const handleLifeCycles = (id, lifeCycles) => {
  Object.entries(lifeCycles).forEach(([fileId, idLifeCycles]) => {
    const prefix = fileId ? `.${fileId}` : ''
    const lifeCycleId = `${id}${prefix}`
    handleVueLifeCycle(lifeCycleId, idLifeCycles)
  })
}

const handleRegistryProp = (id, value) => {
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

export const generateRegistry = (registry) => {
  Object.entries(registry).forEach(([key, value]) => {
    if (typeof value === 'object' && value) {
      const { id } = value
      // 如果匹配到了id，说明是元服务配置，对元服务配置做读取和写入
      if (id && key !== 'metaData') {
        handleRegistryProp(id, value)
        metasHashMap[id] = value
      } else {
        // TODO: 其他类型配置处理
      }

      generateRegistry(value)
    }
  })
}

export const getMergeMeta = (id) => {
  return metasHashMap[id]
}

const mergeObject = (mergeTo, merged) => {
  const prevKeys = Object.keys(mergeTo)
  for (const [currKey, currVal] of Object.entries(merged)) {
    // new key
    if (!prevKeys.includes(currKey)) {
      mergeTo[currKey] = currVal
      continue
    }

    const typeOfVal = typeof currVal
    // 类型不同，不合并
    if (typeof mergeTo[currKey] !== typeOfVal) {
      continue
    }

    // 都是数组
    if (Array.isArray(mergeTo[currKey]) && Array.isArray(currVal)) {
      mergeTo[currKey] = mergeTo[currKey].concat(currVal)
      continue
    }

    // 都是对象
    if (typeOfVal === 'object' && typeOfVal !== null) {
      mergeTo[currKey] = { ...mergeTo[currKey], ...currVal }
    }

    // 剩余类型不不做额外处理
  }

  return mergeTo
}

export const getSharedOptions = (key) => {
  const options = Object.values(metasHashMap)
    .filter(({ id }) => typeof id === 'string')
    .map((meta) => meta.apis?.getSharedOptions?.())
    .filter((options) => typeof options === 'object' && options !== null)
    .reduce((prev, curr) => mergeObject(prev, curr), {})

  for (const [key, value] of Object.entries(options)) {
    if (Array.isArray(value)) {
      options[key] = value
        .map(({ _order, ...rest }) => ({ ...rest, _order: _order ?? Number.MAX_SAFE_INTEGER }))
        .sort((a, b) => a._order - b._order)
    }
  }

  if (key) {
    return options[key]
  }

  return options
}
