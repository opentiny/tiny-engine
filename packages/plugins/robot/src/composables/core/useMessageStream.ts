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

const handleDeltaReasoning = (choice: ChatCompletionStreamResponseChoice, lastMessage: Message) => {
  if (typeof choice.delta.reasoning_content === 'string' && choice.delta.reasoning_content) {
    if (lastMessage.renderContent.at(-1)?.contentType !== 'reasoning') {
      lastMessage.renderContent.push({
        type: 'collapsible-text',
        contentType: 'reasoning',
        title: '深度思考',
        content: '',
        status: 'reasoning',
        defaultOpen: true
      })
    }
    lastMessage.renderContent.at(-1)!.content += choice.delta.reasoning_content
  }
}

const handleDeltaContent = (
  choice: ChatCompletionStreamResponseChoice,
  lastMessage: Message,
  contentType = 'markdown'
) => {
  if (typeof choice.delta.content === 'string' && choice.delta.content) {
    if (lastMessage.renderContent.at(-1)?.contentType === 'reasoning') {
      lastMessage.renderContent.at(-1)!.status = 'finish'
    }
    if (lastMessage.renderContent.at(-1)?.type !== contentType) {
      lastMessage.renderContent.push({ type: contentType, content: '' })
      lastMessage.content = ''
    }
    lastMessage.renderContent.at(-1)!.content += choice.delta.content
    lastMessage.content += choice.delta.content
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

    // 核心流式处理逻辑
    handleDeltaReasoning(choice, lastMessage)
    handleDeltaContent(choice, lastMessage, getContentType())
    handleDeltaToolCalls(choice, lastMessage)

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
