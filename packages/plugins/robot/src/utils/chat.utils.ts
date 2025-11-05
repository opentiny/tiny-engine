import { toRaw } from 'vue'
import { META_SERVICE, getMetaApi } from '@opentiny/tiny-engine-meta-register'
import type { StreamHandler } from '@opentiny/tiny-robot-kit'
import type { LLMMessage, LLMRequestBody, RequestOptions, RequestTool } from '../types'

// 格式化LLM输入messages消息
export const formatMessages = (messages: LLMMessage[]) => {
  const validMessageFilter = (message: LLMMessage) => message.content || message.tool_calls || message.tool_call_id
  return toRaw(messages)
    .filter(validMessageFilter)
    .map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}),
      ...(message.tool_call_id ? { tool_call_id: message.tool_call_id } : {})
    }))
}

export const serializeError = (err: unknown): string => {
  if (err instanceof Error) {
    return JSON.stringify({ name: err.name, message: err.message })
  }
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

/**
 * 合并字符串字段。如果值是对象，则递归合并字符串字段
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export const mergeStringFields = (target: Record<string, any>, source: Record<string, any>) => {
  for (const [key, value] of Object.entries(source)) {
    const targetValue = target[key]

    if (targetValue) {
      if (typeof targetValue === 'string' && typeof value === 'string') {
        // 都是字符串，直接拼接
        target[key] = targetValue + value
      } else if (targetValue && typeof targetValue === 'object' && value && typeof value === 'object') {
        // 都是对象，递归合并
        target[key] = mergeStringFields(targetValue, value)
      }
    } else {
      // 不存在，直接赋值
      target[key] = value
    }
  }

  return target
}

export const fetchLLM = async (messages: LLMMessage[], tools: RequestTool[], options: RequestOptions = {}) => {
  const bodyObj: LLMRequestBody = {
    baseUrl: options.baseUrl,
    model: options?.model || 'deepseek-chat',
    stream: false,
    messages: toRaw(messages)
  }
  if (tools.length > 0) {
    bodyObj.tools = toRaw(tools)
  }
  return getMetaApi(META_SERVICE.Http).post(options?.url || '/app-center/api/chat/completions', bodyObj, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })
}

export const processSSEStream = (data: string, handler: StreamHandler) => {
  let finishReason: string | undefined
  let latestFinishReason: string | undefined
  const lines = data.split('\n\n')
  lines.pop()

  for (const line of lines) {
    if (line.trim() === '') continue
    if (line.trim() === 'data: [DONE]') {
      if (latestFinishReason) {
        finishReason = latestFinishReason
      }
      handler.onDone(finishReason)
      continue
    }

    try {
      // 解析SSE消息
      const dataMatch = line.match(/^data: (.+)$/m)
      if (!dataMatch) continue

      const data = JSON.parse(dataMatch[1])
      handler.onData(data)
      latestFinishReason = data.choices?.[0]?.finish_reason || undefined
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing SSE message:', error, line)
    }
  }
}
