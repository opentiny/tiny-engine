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

import { removeLoading } from '../../utils'
import useModelConfig from '../core/useConfig'
import useMcpServer from '../features/useMcp'
import type { ModeHooks } from '../../types/mode.types'
import { ChatMode } from '../../types/mode.types'

const updateToolCallRenderContent = (tool: Record<string, unknown>, renderContent: any[]) => {
  const currentToolCallContent = renderContent.find((item) => item.type === 'tool' && item.toolCallId === tool.id)
  if (currentToolCallContent) {
    currentToolCallContent.status = 'running'
    if (!currentToolCallContent.content) {
      currentToolCallContent.content = {}
    }
    currentToolCallContent.content.params = tool.parsedArgs || tool.function!.arguments || {}
  } else {
    renderContent.push({
      type: 'tool',
      name: tool.name || tool.function!.name,
      status: 'running',
      content: {
        params: tool.parsedArgs || tool.function!.arguments || {}
      },
      formatPretty: true,
      toolCallId: tool.id
    })
  }
}

/**
 * Chat 模式实现
 * 特点：
 * - 标准的对话模式
 * - 支持 MCP 工具调用
 * - 简单的 loading 处理
 * - 无需 schema 更新
 */
export default function useChatMode(): ModeHooks {
  const { getSelectedModelInfo } = useModelConfig()

  // ========== 配置方法 ==========
  const getApiUrl = () => '/app-center/api/chat/completions'

  const getContentType = () => 'markdown'

  const getLoadingType = () => 'loading'

  // ========== 生命周期钩子 ==========
  const onConversationStart = (conversationState: any, messages: any[], apis: any) => {
    const conversation = conversationState.conversations.find((item: any) => item.id === conversationState.currentId)

    // 确保会话元数据中记录为 Chat 模式
    if (!conversation.metadata?.chatMode || conversation.metadata.chatMode !== ChatMode.Chat) {
      apis.updateMetadata(conversationState.currentId, { chatMode: ChatMode.Chat })
      apis.saveConversations()
    }

    // Chat 模式简单移除 loading
    removeLoading(messages)
  }

  const onMessageSent = () => {
    // Chat 模式暂无特殊处理
  }

  const onBeforeRequest = async (requestParams: any) => {
    const tools = await useMcpServer().getLLMTools()
    const { model, baseUrl, config, capabilities } = getSelectedModelInfo()

    // 添加 MCP 工具
    if (!requestParams.tools && tools?.length && capabilities?.toolCalling !== false) {
      Object.assign(requestParams, { tools })
    }

    requestParams.baseUrl = baseUrl
    requestParams.model = model

    if (capabilities?.reasoning?.extraBody) {
      Object.assign(
        requestParams,
        config?.enableThinking ? capabilities.reasoning.extraBody.enable : capabilities.reasoning.extraBody.disable
      )
    }

    return requestParams
  }

  const onStreamStart = (messages: any[]) => {
    removeLoading(messages)
  }

  const onStreamData = (_data: object, _content: string | object, _messages: any[]) => {
    // Chat 模式不需要处理流式数据
  }

  const onRequestEnd = async (finishReason: string, _content: string, messages: any[]) => {
    if (finishReason === 'aborted' || finishReason === 'error') {
      removeLoading(messages)
    }
  }

  const onStreamTools = (tools: Record<string, unknown>[], { currentMessage }: { currentMessage: any }) => {
    tools.forEach((tool) => updateToolCallRenderContent(tool, currentMessage.renderContent))
  }

  const onBeforeCallTool = (tool: Record<string, unknown>, { currentMessage }: { currentMessage: any }) => {
    updateToolCallRenderContent(tool, currentMessage.renderContent)
  }

  const onPostCallTool = (
    tool: Record<string, unknown>,
    toolCallResult: object | string,
    toolCallStatus: string,
    { currentMessage }: { currentMessage: any }
  ) => {
    currentMessage.renderContent.at(-1)!.status = toolCallStatus
    currentMessage.renderContent.at(-1)!.content = {
      params: tool.parsedArgs,
      result: toolCallResult
    }
  }

  const onPostCallTools = (_toolsResult: Record<string, unknown>[], { currentMessage }: { currentMessage: any }) => {
    currentMessage.renderContent.push({ type: 'loading', content: '' })
  }

  const onMessageProcessed = async (
    _finishReason: string,
    _content: string,
    _messages: any[],
    _context: { abortControllerMap: Record<string, AbortController> }
  ) => {
    // Chat 模式不需要处理消息
  }

  const onConversationEnd = (_conversationId: string) => {
    // Chat 模式暂无特殊处理
  }

  return {
    // 配置方法
    getApiUrl,
    getContentType,
    getLoadingType,

    // 生命周期钩子
    onConversationStart,
    onMessageSent,
    onBeforeRequest,
    onStreamStart,
    onStreamData,
    onRequestEnd,
    onStreamTools,
    onBeforeCallTool,
    onPostCallTool,
    onPostCallTools,
    onMessageProcessed,
    onConversationEnd
  }
}
