import { toRaw } from 'vue'
import type { AIClient } from '@opentiny/tiny-robot-kit'
import useMcpServer from './useMcp'
import { serializeError } from '../../utils'
import type { ResponseToolCall, RobotMessage, LLMMessage } from '../../types'

const parseArgs = (args: string) => {
  try {
    return JSON.parse(args)
  } catch (error) {
    return args
  }
}

const callTool = async (name: string, args: Record<string, unknown>) => {
  let toolCallResult: object | string
  let toolCallStatus: 'success' | 'failed'
  try {
    const resp = await useMcpServer().callTool(name, args)
    toolCallStatus = 'success'
    toolCallResult = resp.content
  } catch (error) {
    toolCallStatus = 'failed'
    toolCallResult = serializeError(error)
  }
  return { toolCallResult, toolCallStatus }
}

interface CallToolHooks {
  onBeforeCallTool: (tool: Record<string, unknown>) => void
  onPostCallTool: (tool: Record<string, unknown>, toolCallResult: object | string, toolCallStatus: string) => void
}

export const callTools = async (tool_calls: any, hooks: CallToolHooks, signal: AbortController['signal']) => {
  const result = []
  for (const tool of tool_calls) {
    const { name, arguments: args } = tool.function
    const parsedArgs = parseArgs(args) ?? {}
    tool.parsedArgs = parsedArgs
    tool.name = name

    hooks.onBeforeCallTool(tool)

    const { toolCallResult, toolCallStatus } = await callTool(name, parsedArgs)
    result.push({ toolCallResult, toolCallStatus, ...tool })

    hooks.onPostCallTool(tool, toolCallResult, toolCallStatus)

    if (signal?.aborted) {
      return Promise.reject('aborted')
    }
  }
  return result
}

// 工厂函数配置接口
export interface ToolCallHandlerConfig {
  client: AIClient
  getAbortController: () => AbortController
  formatMessages: (messages: any[]) => LLMMessage[]
  hooks: {
    onBeforeCallTool: (tool: Record<string, unknown>, context: { currentMessage: any }) => void
    onPostCallTool: (
      tool: Record<string, unknown>,
      toolCallResult: object | string,
      toolCallStatus: string,
      context: { currentMessage: any }
    ) => void
    onPostCallTools: (results: any[], context: { currentMessage: any }) => void
  }
  streamHandlers: {
    onData: (data: any, messages: any[]) => void
    onError: (error: any, messages: any[], messageState: any) => void
    onDone: (finishReason: string, messages: any[], contextMessages: any[], messageState: any) => Promise<void>
  }
  getMessageState: () => any
}

/**
 * 创建工具调用处理器
 * 使用工厂函数模式，将所有依赖通过配置注入
 */
export function createToolCallHandler(config: ToolCallHandlerConfig) {
  const { client, getAbortController, formatMessages, hooks, streamHandlers, getMessageState } = config

  return async (tool_calls: ResponseToolCall[], messages: any[], contextMessages: RobotMessage[]) => {
    const hasToolCall = tool_calls?.length > 0
    if (!hasToolCall) {
      return
    }

    // 获取新的 AbortController
    const abortController = getAbortController()

    const currentMessage = messages.at(-1)
    const toolMessages: LLMMessage[] = formatMessages([...contextMessages, toRaw(currentMessage)])

    // 构建工具调用的 hooks
    const toolCallHooks = {
      onBeforeCallTool: (tool: Record<string, unknown>) => hooks.onBeforeCallTool(tool, { currentMessage }),
      onPostCallTool: (tool: Record<string, unknown>, toolCallResult: object | string, toolCallStatus: string) =>
        hooks.onPostCallTool(tool, toolCallResult, toolCallStatus, { currentMessage })
    }

    try {
      const result = await callTools(tool_calls, toolCallHooks, abortController.signal)
      toolMessages.push(
        ...result.map((item) => ({
          content: JSON.stringify(item.toolCallResult),
          role: 'tool',
          tool_call_id: item.id
        }))
      )
      hooks.onPostCallTools(result, { currentMessage })
    } catch (error) {
      return
    }

    delete currentMessage.tool_calls

    // 使用工具调用结果继续对话
    await client.chatStream(
      { messages: toolMessages as any, options: { signal: abortController.signal } },
      {
        onData: (data) => streamHandlers.onData(data, messages),
        onError: (error) => streamHandlers.onError(error, messages, getMessageState()),
        onDone: (finishReason?: string) =>
          streamHandlers.onDone(finishReason ?? 'unknown', messages, toolMessages, getMessageState())
      }
    )
  }
}
