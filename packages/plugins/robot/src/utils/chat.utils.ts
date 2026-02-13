import { toRaw } from 'vue'
import type { StreamHandler } from '@opentiny/tiny-robot-kit'
import type { LLMMessage, RobotMessage } from '../types'

// 格式化LLM输入messages消息
export const formatMessages = (messages: LLMMessage[]) => {
  const validMessageFilter = (message: LLMMessage) => message.content || message.tool_calls || message.tool_call_id
  return toRaw(messages)
    .filter(validMessageFilter)
    .map((message) => ({
      role: message.role,
      content: message.content,
      ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}),
      ...(message.tool_call_id ? { tool_call_id: message.tool_call_id } : {}),
      ...(message.reasoning_content ? { reasoning_content: message.reasoning_content } : {})
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

export const removeLoading = (messages: RobotMessage[], name?: string) => {
  const renderContent = messages.at(-1)?.renderContent
  if (!renderContent || !renderContent.length) return
  const index = renderContent.findLastIndex(
    (item) => item.type.includes('loading') && (name ? item.content === name : true)
  )
  if (index !== -1) {
    renderContent?.splice(index, 1)
  }
}

export const addSystemPrompt = (messages: LLMMessage[], prompt: string = '') => {
  if (!messages.length || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: prompt })
  } else if (messages[0].role === 'system' && messages[0].content !== prompt) {
    messages[0].content = prompt
  }
}
