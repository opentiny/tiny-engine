import type { IState, ToolItem } from './type'
import type { ZodRawShape } from 'zod'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.d.ts'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.d.ts'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const logger = console

// 定义 UpdateToolConfig 接口
export interface UpdateToolConfig {
  title?: string | undefined
  description?: string | undefined
  paramsSchema?: ZodRawShape | undefined
  outputSchema?: ZodRawShape | undefined
  annotations?: ToolAnnotations | undefined
  callback?: ToolCallback<ZodRawShape>
  enabled?: boolean
}

export const getToolList = (state: IState) => {
  return state.toolList.map((toolItem) => {
    const toolInstance = state.toolInstanceMap.get(toolItem.name)

    return {
      ...toolItem,
      status: toolInstance ? (toolInstance.enabled ? 'enabled' : 'disabled') : 'not_registered'
    }
  })
}

export const getToolByName = (state: IState, name: string) => {
  const toolItem = state.toolList.find((tool) => tool.name === name)

  if (!toolItem) {
    return null
  }

  const toolInstance = state.toolInstanceMap.get(name)

  return { ...toolItem, status: toolInstance ? (toolInstance.enabled ? 'enabled' : 'disabled') : 'not_registered' }
}

export const getToolInstance = (state: IState, name: string) => {
  return state.toolInstanceMap.get(name)
}

export const registerTools = (state: IState, tools: ToolItem[]) => {
  if (!Array.isArray(tools) || !tools.length) {
    return
  }

  if (!state.server) {
    logger.error('mcp server is not created')
    return
  }

  const toolInstances = tools.map((tool) => {
    const { name, callback, ...restConfig } = tool

    const toolInstance = state.server?.registerTool(name, restConfig, callback as ToolCallback<ZodRawShape>)

    if (toolInstance) {
      state.toolInstanceMap.set(name, toolInstance)
      state.toolList.push(tool)
    }

    return toolInstance
  })

  return toolInstances
}

export const enableTool = (state: IState, name: string) => {
  const toolInstance = state.toolInstanceMap.get(name)

  if (toolInstance) {
    toolInstance.enable()
  }
}

export const disableTool = (state: IState, name: string) => {
  const toolInstance = state.toolInstanceMap.get(name)

  if (toolInstance) {
    toolInstance.disable()
  }
}

export const removeTool = (state: IState, name: string) => {
  const toolInstance = state.toolInstanceMap.get(name)

  if (toolInstance) {
    toolInstance.remove()
    state.toolInstanceMap.delete(name)
  }
}

export const updateTool = (state: IState, name: string, config?: UpdateToolConfig) => {
  const toolInstance = state.toolInstanceMap.get(name)

  if (toolInstance) {
    toolInstance.update({ name, ...(config || {}) })
  }
}

// server 初始化时，批量注册 state 中存储的 tools
export const initRegisterTools = (state: IState, server: McpServer) => {
  state.toolList.forEach((tool) => {
    const { name, callback, inputSchema, outputSchema, ...restConfig } = tool

    try {
      if (state.toolInstanceMap.has(name)) {
        logger.error(`tool ${name} already registered`)
        return
      }

      if (!name || typeof name !== 'string') {
        logger.error('tool name is required and must be a string')
        return
      }

      if (!callback || typeof callback !== 'function') {
        logger.error('tool callback is required and must be a function')
        return
      }

      const toolInstance = server.registerTool(
        name,
        // 需要序列化一次，否则 list tool 会超时，因为有 proxy 之后，内部会报错
        {
          ...JSON.parse(JSON.stringify(restConfig)),
          inputSchema,
          outputSchema
        },
        callback as ToolCallback<ZodRawShape>
      )

      state.toolInstanceMap.set(name, toolInstance)
    } catch (error) {
      logger.error('error when register tool', error)
    }
  })
}
