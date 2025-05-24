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
      continue
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

const handleVueTemplate = (id: string, templates: any) => {
  Object.entries(templates).forEach(([name, template]) => {
    if (typeof template === 'string') {
      const prefix = name && name !== "''" ? `.${name}` : ''
      const templateId = `${id}${prefix}`
      templateHashMap[templateId] = template
    }
  })
}

const handleRegistryProp = (id: string, value: any) => {
  const { overwrite } = value
  // 逻辑复写
  if (typeof overwrite === 'object' && overwrite) {
    const { templates, lifeCycles, methods } = overwrite
    // 处理模板
    if (templates) {
      handleVueTemplate(id, templates)
    }
    // 处理生命周期
    if (lifeCycles) {
      handleLifeCycles(id, lifeCycles)
    }
    if (methods) {
      handleMethods(id, methods)
    }
  }
}

export const generateRegistry = (registry: any) => {
  if (Object.prototype.toString.call(registry) !== '[object Object]') {
    return
  }

  Object.entries(registry).forEach(([key, value]) => {
    if (typeof value === 'object' && value && !isRef(value)) {
      handleRegistryProp(key, value)

      // generateRegistry(value)
    }
  })
}

export const defineEntry = (registry: any) => {
  if (!registry) {
    throw new Error('请传递正确的注册表')
  }

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

const FILE_TYPE = {
  JAVASCRIPT: 'javascript',
  JSON: 'json'
}

async function checkFileType(url: string) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    const contentType = res.headers.get('content-type')

    if (contentType?.includes(FILE_TYPE.JAVASCRIPT)) {
      return FILE_TYPE.JAVASCRIPT
    }

    if (contentType?.includes(FILE_TYPE.JSON)) {
      return FILE_TYPE.JSON
    }

    return 'unknown'
  } catch (error) {
    throw new Error('[hotfix registry] file type check failed, source file is not a valid js or json file')
  }
}

export const fetchHotfixRegistry = async (url: string): Promise<any> => {
  try {
    const fileType = await checkFileType(url)
    let registry = null

    if (fileType === FILE_TYPE.JAVASCRIPT) {
      const res = await import(/* @vite-ignore */ url)
      registry = res.default
    } else if (fileType === FILE_TYPE.JSON) {
      registry = await fetch(url).then((res) => res.json())
    }
    return registry
  } catch (error) {
    throw new Error('[hotfix registry] fetch registry failed, please check the url is valid')
  }
}

interface HotfixRegistryOptions {
  url: string
  request?: typeof fetchHotfixRegistry
}

export const initHotfixRegistry = async ({
  url,
  request = fetchHotfixRegistry
}: HotfixRegistryOptions): Promise<any> => {
  try {
    const registry = await request(url)

    if (registry) {
      defineEntry(registry)
      return registry
    }
  } catch (error) {
    const logger = console
    logger.warn('[hotfix registry] Failed to load and register registry. Please verify the URL is valid')
    // 忽略错误，这里有可能是没有线上的 hotfix 注册表
  }
}
