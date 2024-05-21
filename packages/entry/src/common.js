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

const handleMethods = (id, methods) => {
  Object.entries(methods).forEach(([fileId, idMethods]) => {
    if (typeof idMethods === 'object') {
      Object.entries(idMethods).forEach(([name, method]) => {
        const prefix = fileId ? `.${fileId}` : ''
        const methodId = `${id}${prefix}.${name}`
        entryHashMap[methodId] = method
      })
    }
  })
}

const handleVueLifeCycle = (id, value) => {
  vueLifeHook.forEach((hookName) => {
    const hookConfig = value[hookName]
    if (!hookConfig) {
      return
    }
    if (typeof hookConfig === 'function') {
      const hookId = `${id}.${hookName}[0]`
      entryHashMap[hookId] = hookConfig
    }
    if (hookConfig instanceof Array) {
      hookConfig.forEach((hookFn, index) => {
        if (typeof hookFn === 'function') {
          const hookId = `${id}.${hookName}[${index}]`
          entryHashMap[hookId] = hookFn
        }
      })
    }
  })
}

const handleLifeCycles = (id, lifeCycles) => {
  Object.entries(lifeCycles).forEach(([fileId, idLifeCycles]) => {
    const prefix = fileId ? `.${fileId}` : ''
    const lifeCycleId = `${id}${prefix}`
    handleVueLifeCycle(lifeCycleId, idLifeCycles)
  })
}

const handleRegistryProp = (id, value) => {
  const { template, layout, methods, lifeCycles } = value
  // 处理生命周期
  if (lifeCycles) {
    handleLifeCycles(id, lifeCycles)
  }
  // 如果id和模板配置同时存在则放到模板hash表中
  if (template) {
    templateHashMap[id] = template
  }
  if (layout) {
    layoutHashMap[id] = layout
  }
  if (methods) {
    handleMethods(id, methods)
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

export const getMergeMeta = (meta) => {
  return metasHashMap[meta?.id]
}
