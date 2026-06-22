import type { ChatCompletionStreamResponseChoice } from '@opentiny/tiny-robot-kit'
import type { Message, ResponseToolCall } from '../../types'
import { mergeStringFields } from '../../utils'

// 流式数据处理器配置选项
export interface StreamDataHandlerOptions {
  getContentType: () => string
  hooks: {
    onStreamStart: (messages: any[]) => void
    onStreamData: (data: any, content: any, messages: any[]) => void
    onStreamTools: (tools: any[], context: { currentMessage: any }) => void
  }
  statusManager: {
    isStreaming: () => boolean
    setStreaming: () => void
  }
}

const handleDeltaReasoning = (
  choice: ChatCompletionStreamResponseChoice,
  lastMessage: Message,
  reasoningAlreadyMerged = false
) => {
  if (typeof choice.delta.reasoning_content === 'string' && choice.delta.reasoning_content && !reasoningAlreadyMerged) {
    lastMessage.reasoning_content = (lastMessage.reasoning_content || '') + choice.delta.reasoning_content
  }
}

const handleDeltaContent = (
  choice: ChatCompletionStreamResponseChoice,
  lastMessage: Message,
  contentType = 'markdown'
) => {
  if (typeof choice.delta.content === 'string' && choice.delta.content) {
    if (lastMessage.renderContent.at(-1)?.type !== contentType) {
      lastMessage.renderContent.push({ type: contentType, content: '' })
    }
    lastMessage.renderContent.at(-1)!.content += choice.delta.content
  }
}

const handleDeltaToolCalls = (choice: ChatCompletionStreamResponseChoice, lastMessage: Message) => {
  const toolCallChunks = choice.delta.tool_calls as (ResponseToolCall & { index: number })[]
  if (Array.isArray(toolCallChunks) && toolCallChunks.length) {
    if (!lastMessage.tool_calls) {
      lastMessage.tool_calls = []
    }
    for (const chunk of toolCallChunks) {
      const { index, ...chunkWithoutIndex } = chunk
      if (lastMessage.tool_calls[index]) {
        mergeStringFields(lastMessage.tool_calls[index], chunkWithoutIndex)
      } else {
        lastMessage.tool_calls[index] = chunkWithoutIndex
      }
    }
  }
}

const mergeUnprocessedDelta = (choice: ChatCompletionStreamResponseChoice, lastMessage: Message) => {
  handleDeltaReasoning(choice, lastMessage)
  if (typeof choice.delta.content === 'string' && choice.delta.content) {
    lastMessage.content ||= ''
    lastMessage.content += choice.delta.content
  }
  handleDeltaToolCalls(choice, lastMessage)
}

const syncThinkingState = (choice: ChatCompletionStreamResponseChoice, lastMessage: Message) => {
  if (typeof choice.delta.reasoning_content !== 'string') {
    return
  }

  lastMessage.state ||= {}
  lastMessage.state.thinking = Boolean(choice.delta.reasoning_content)
}

/**
 * 创建流式数据处理器
 * 通过依赖注入解耦业务逻辑与状态管理、回调函数
 * @param options 配置选项，包含内容类型获取、钩子函数、状态管理器
 * @returns 流式数据处理函数
 */
export function createStreamDataHandler(options: StreamDataHandlerOptions) {
  const { getContentType, hooks, statusManager } = options

  return (data: any, messages: any[]) => {
    const choice = data.choices?.[0]
    if (!choice) {
      return
    }

    const lastMessage = messages.at(-1) as Message

    // 处理首次流式响应
    if (!statusManager.isStreaming()) {
      statusManager.setStreaming()
      hooks.onStreamStart(messages)
    }

    if (!data.__contentAlreadyMerged) {
      mergeUnprocessedDelta(choice, lastMessage)
    }
    syncThinkingState(choice, lastMessage)
    handleDeltaContent(choice, lastMessage, getContentType())

    // 触发钩子
    if (typeof choice.delta.content === 'string' && choice.delta.content) {
      hooks.onStreamData(data, lastMessage.content, messages)
    }
    if (choice.delta.tool_calls?.length) {
      hooks.onStreamTools(lastMessage.tool_calls || [], { currentMessage: lastMessage })
    }
  }
}

export default function useMessageStream() {
  return {
    handleDeltaReasoning,
    handleDeltaContent,
    handleDeltaToolCalls,
    createStreamDataHandler
  }
}
