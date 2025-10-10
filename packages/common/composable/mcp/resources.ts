import { toRaw } from 'vue'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ResourceItem, ResourceTemplateItem, IState } from './type'
import type { RegisteredResource, ReadResourceCallback } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'

const logger = console

// 资源更新配置（直接透传 SDK RegisteredResource.update 的入参）
export interface UpdateResourceConfig {
  uri?: string | null
  name?: string
  title?: string
  metadata?: any
  callback?: ReadResourceCallback
  enabled?: boolean
}

// 获取（或初始化）资源实例映射
const ensureResourceMap = (state: IState) => {
  if (!state.resourceInstanceMap) {
    state.resourceInstanceMap = new Map<string, RegisteredResource>()
  }
  return state.resourceInstanceMap
}

// 构造用于注册的 metadata（去 Proxy 深拷贝）
const buildMetadata = (item: ResourceItem) => {
  const meta = {
    title: item.title,
    description: item.description,
    mimeType: item.mimeType,
    annotations: toRaw(item.annotations)
  }
  return JSON.parse(JSON.stringify(meta))
}

// 批量注册资源（幂等：同 uri 已有实例则 update 对齐）
export const registerResources = (state: IState, items: ResourceItem[]) => {
  if (!Array.isArray(items) || !items.length) return
  if (!state.server) {
    logger.error('mcp server is not created')
    return
  }

  const map = ensureResourceMap(state)

  const instances: (RegisteredResource | undefined)[] = items.map((item) => {
    const uri = item.uri
    const name = item.name || ''
    const metadata = buildMetadata(item)

    try {
      const exist = map.get(uri)
      if (exist) {
        exist.update({ name, uri, metadata, callback: item.readCallback })
        return exist
      }

      const instance = state.server!.registerResource(name, uri, metadata, item.readCallback)
      if (instance) {
        map.set(uri, instance)
      }
      return instance
    } catch (e) {
      logger.error('error when register resource', uri, e)
      return undefined
    }
  })

  try {
    state.server.sendResourceListChanged()
  } catch (e) {
    logger.error('error when sendResourceListChanged after registerResources', e)
  }

  return instances
}

// 获取资源列表（对齐工具侧：带 status）
export const getResourceList = (state: IState) => {
  const defs: ResourceItem[] = state.resources || []
  const map = ensureResourceMap(state)

  return defs.map((def) => {
    const inst = map.get(def.uri)
    const metadata = inst?.metadata || {}
    const merged = {
      uri: def.uri,
      name: inst?.name ?? def.name,
      title: inst?.title ?? def.title,
      description: metadata?.description ?? def.description,
      mimeType: metadata?.mimeType ?? def.mimeType,
      annotations: metadata?.annotations ?? def.annotations,
      status: inst ? (inst.enabled ? 'enabled' : 'disabled') : 'not_registered'
    }
    return merged
  })
}

// 按 uri 获取资源（不存在定义则返回 null）
export const getResourceByUri = (state: IState, uri: string) => {
  const def = (state.resources || []).find((r) => r.uri === uri)
  if (!def) return null
  const map = ensureResourceMap(state)
  const inst = map.get(uri)
  const metadata = inst?.metadata || {}
  return {
    uri: def.uri,
    name: inst?.name ?? def.name,
    title: inst?.title ?? def.title,
    description: metadata?.description ?? def.description,
    mimeType: metadata?.mimeType ?? def.mimeType,
    annotations: metadata?.annotations ?? def.annotations,
    status: inst ? (inst.enabled ? 'enabled' : 'disabled') : 'not_registered'
  }
}

// 注销实例，保留定义
export const removeResource = (state: IState, uri: string) => {
  const map = ensureResourceMap(state)
  const inst = map.get(uri)
  if (!inst) {
    logger.error('resource instance not found for uri:', uri)
    return
  }
  try {
    inst.remove()
  } catch (e) {
    logger.error('error when remove resource', uri, e)
  } finally {
    map.delete(uri)

    try {
      state.server?.sendResourceListChanged()
    } catch (e) {
      logger.error('error when sendResourceListChanged after removeResource', e)
    }
  }
}

// 透传实例的 update；若 uri 变更，同步迁移本地映射键
export const updateResource = (state: IState, uri: string, updates?: UpdateResourceConfig) => {
  const map = ensureResourceMap(state)
  const inst = map.get(uri)
  if (!inst || !updates || typeof updates !== 'object') {
    logger.error('resource instance not found for uri:', uri)
    return
  }

  try {
    inst.update(updates)
  } catch (e) {
    logger.error('error when update resource', uri, e)
    return
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'uri')) {
    const newUri = updates.uri as string | null | undefined
    if (typeof newUri === 'string' && newUri && newUri !== uri) {
      try {
        map.delete(uri)
        map.set(newUri, inst)
      } catch (e) {
        logger.error('error when migrate resourceInstanceMap key', uri, '->', newUri, e)
      }
    }
  }

  try {
    state.server?.sendResourceListChanged()
  } catch (e) {
    logger.error('error when sendResourceListChanged after updateResource', e)
  }
}

// 注册资源与资源模板
export const initRegisterResources = (state: IState, server: McpServer) => {
  try {
    const resources: ResourceItem[] = state.resources || []
    const resourceTemplates: ResourceTemplateItem[] = state.resourceTemplates || []

    const map = ensureResourceMap(state)

    resources.forEach((resourceItem) => {
      try {
        const instance = server.registerResource(
          resourceItem.name || '',
          resourceItem.uri,
          buildMetadata(resourceItem),
          resourceItem.readCallback
        )
        if (instance) {
          map.set(resourceItem.uri, instance)
        }
      } catch (e) {
        logger.error('error when register resource', resourceItem?.uri, e)
      }
    })

    resourceTemplates.forEach((resourceItem) => {
      try {
        const template = resourceItem.template || new ResourceTemplate(resourceItem.uriTemplate, { list: undefined })
        server.registerResource(
          resourceItem.name,
          template,
          {
            title: resourceItem.title,
            description: resourceItem.description,
            mimeType: resourceItem.mimeType,
            annotations: toRaw(resourceItem.annotations),
            // 将 variables 与 variablesSchemaUri 作为元数据透传，便于远端 listResourceTemplates 返回
            variables: toRaw((resourceItem as any).variables),
            variablesSchemaUri: toRaw((resourceItem as any).variablesSchemaUri)
          },
          resourceItem.readTemplateCallback
        )
      } catch (e) {
        logger.error('error when register resource template', resourceItem?.uriTemplate, e)
      }
    })

    server.sendResourceListChanged()
  } catch (error) {
    logger.error('error when register resources/templates', error)
  }
}
