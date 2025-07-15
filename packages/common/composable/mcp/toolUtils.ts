import type { IState, ToolItem } from './common'
import type { ZodRawShape } from 'zod'
import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.d.ts'
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.d.ts'

const logger = console

// 定义 UpdateToolConfig 接口
export interface UpdateToolConfig {
  title?: string | undefined
  description?: string | undefined
  inputSchema?: ZodRawShape | undefined
  outputSchema?: ZodRawShape | undefined
  annotations?: ToolAnnotations | undefined
  callback?: ToolCallback<ZodRawShape>
}

export const getToolList = (state: IState) => {
  return state.toolList
}

export const getToolByName = (state: IState, name: string) => {
  return state.toolList.find((tool) => tool.name === name)
}

export const getToolInstance = (state: IState, name: string) => {
  return state.toolInstanceMap.get(name)
}

export const registerTool = (state: IState, tool: ToolItem) => {
  if (!state.server) {
    logger.error('mcp server is not created')
    return
  }

  const { name, callback, ...restConfig } = tool

  const toolInstance = state.server?.registerTool(name, restConfig, callback as ToolCallback<ZodRawShape>)

  state.toolInstanceMap.set(name, toolInstance)
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
  }
}

export const updateTool = (state: IState, name: string, config?: UpdateToolConfig) => {
  const toolInstance = state.toolInstanceMap.get(name)

  if (toolInstance) {
    toolInstance.update({ name, ...(config || {}) })
  }
}
