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

import { getMetaApi, META_SERVICE, useCanvas, useMaterial } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { isValidJsonPatchObjectString, getRobotServiceOptions, removeLoading, addSystemPrompt } from '../../utils'
import { updatePageSchema } from '../core/pageUpdater'
import useModelConfig from '../core/useConfig'
import { formatComponents, getAgentSystemPrompt, getJsonFixPrompt } from '../../constants/prompts'
import { search, fetchAssets } from '../../services/agentServices'
import { client } from '../../services/aiClient'
import type { ModeHooks } from '../../types/mode.types'
import { ChatMode } from '../../types/mode.types'
import { STATUS, type MessageState } from '@opentiny/tiny-robot-kit'

const { deepClone } = utils
const logger = console

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
 * Agent 模式实现
 * 特点：
 * - 使用 JSON Patch 更新页面 schema
 * - 支持 RAG 上下文和资源上下文
 * - 支持思考模式（thinking）
 * - 实时更新画布
 * - JSON 修复机制
 */
export default function useAgentMode(): ModeHooks {
  let pageSchema: object | null = null
  const { getSelectedModelInfo } = useModelConfig()

  // ========== 配置方法 ==========
  const getApiUrl = () => 'app-center/api/ai/chat'

  const getContentType = () => 'agent-content'

  const getLoadingType = () => 'agent-loading'

  // ========== 生命周期钩子 ==========
  const onConversationStart = (conversationState: any, messages: any[], apis: any) => {
    const conversation = conversationState.conversations.find((item: any) => item.id === conversationState.currentId)

    // 确保会话元数据中记录为 Agent 模式
    if (!conversation.metadata?.chatMode || conversation.metadata.chatMode !== ChatMode.Agent) {
      apis.updateMetadata(conversationState.currentId, { chatMode: ChatMode.Agent })
      apis.saveConversations()
    }

    // Agent 模式特殊处理：标记失败的 loading
    messages.at(-1)?.renderContent?.forEach((item: any) => {
      if (item.type.includes('loading') || item.status !== 'success') {
        item.status = 'failed'
      }
    })
  }

  const onMessageSent = () => {
    pageSchema = deepClone(useCanvas().pageState.pageSchema)
  }

  const onBeforeRequest = async (requestParams: any) => {
    let referenceContext = ''
    let imageAssets: any[] = []

    // 添加系统提示词
    if (requestParams.messages[0]?.role !== 'system') {
      if (getRobotServiceOptions()?.enableRagContext) {
        referenceContext = await search(requestParams.messages?.at(-1)?.content)
      }
      if (getRobotServiceOptions()?.enableResourceContext !== false) {
        const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
        imageAssets = await fetchAssets(appId)
      }
      const { materialState, getComponentDetail } = useMaterial()
      const components = formatComponents(materialState.components, getComponentDetail)
      addSystemPrompt(
        requestParams.messages,
        getAgentSystemPrompt(components, pageSchema, referenceContext, imageAssets)
      )
    }

    const { baseUrl, model, config, capabilities } = getSelectedModelInfo()

    requestParams.baseUrl = baseUrl
    requestParams.model = model

    if (capabilities?.reasoning?.extraBody) {
      const extraBody = config?.enableThinking
        ? capabilities.reasoning.extraBody.enable
        : capabilities.reasoning.extraBody.disable
      if (extraBody) {
        Object.assign(requestParams, extraBody)
      }
    }

    // Agent 模式默认使用 JSON 对象格式
    if (capabilities?.jsonOutput?.extraBody?.enable) {
      Object.assign(requestParams, capabilities.jsonOutput.extraBody.enable)
    }

    return requestParams
  }

  const onStreamStart = (messages: any[]) => {
    removeLoading(messages)
  }

  const onStreamData = (data: object, content: string | object, _messages: any[]) => {
    updatePageSchema(content, pageSchema!)
  }

  const onRequestEnd = async (
    finishReason: string,
    content: string,
    messages: any[],
    extraData?: Record<string, unknown>
  ) => {
    if (finishReason === 'aborted' || finishReason === 'error') {
      removeLoading(messages)
      const errorInfo = { content: extraData?.error || '请求失败', status: 'failed' }
      if (messages.at(-1).renderContent.at(-1)) {
        Object.assign(messages.at(-1).renderContent.at(-1), errorInfo)
      } else {
        messages.at(-1).renderContent = [{ type: getContentType(), ...errorInfo }]
      }
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

  const onMessageProcessed = async (
    finishReason: string,
    content: string,
    messages: any[],
    {
      abortControllerMap,
      messageState
    }: { abortControllerMap: Record<string, AbortController>; messageState: MessageState }
  ) => {
    const lastMessage = messages.at(-1)

    if (finishReason === 'aborted' || finishReason === 'error') {
      lastMessage.renderContent.at(-1).status = 'failed'
      return
    }

    const jsonValidResult = isValidJsonPatchObjectString(content)
    // JSON 修复机制
    if (jsonValidResult.isError) {
      abortControllerMap.errorFix = new AbortController()
      try {
        const beforeRequest = (requestParams: any) => {
          const { capabilities, model, baseUrl } = getSelectedModelInfo()
          if (capabilities?.reasoning?.extraBody?.disable) {
            Object.assign(requestParams, capabilities.reasoning.extraBody.disable)
          }
          if (capabilities?.jsonOutput?.extraBody?.enable) {
            Object.assign(requestParams, capabilities.jsonOutput.extraBody.enable)
          }
          Object.assign(requestParams, {
            model,
            baseUrl
          })
          return requestParams
        }
        const apiUrl = 'app-center/api/chat/completions'
        lastMessage.renderContent.at(-1).status = 'fix'
        const fixedResponse = await client.chat({
          messages: [{ role: 'user', content: getJsonFixPrompt(content, jsonValidResult.error) }],
          options: { signal: abortControllerMap.errorFix?.signal, beforeRequest: beforeRequest as any, apiUrl }
        })
        if (!isValidJsonPatchObjectString(fixedResponse.choices[0].message.content).isError) {
          lastMessage.originContent = lastMessage.content
          lastMessage.content = fixedResponse.choices[0].message.content
        }
      } catch (error) {
        logger.error('json fix failed', error)
        lastMessage.renderContent.at(-1).status = 'failed'
        if (error instanceof Error && error.message.includes('canceled')) {
          messageState.status = STATUS.ABORTED
        } else {
          messageState.status = STATUS.ERROR
          messageState.errorMsg = `JSON 修复失败：${error}`
        }
        delete abortControllerMap.errorFix
        return
      }
      delete abortControllerMap.errorFix
    }

    // 更新页面 schema
    const result = await updatePageSchema(lastMessage.content, pageSchema, true)
    if (result.schema) {
      lastMessage.renderContent.at(-1).status = 'success'
      lastMessage.renderContent.at(-1).schema = result.schema
    } else {
      lastMessage.renderContent.at(-1).status = 'failed'
    }

    pageSchema = null
  }

  const onPostCallTools = (toolsResult: Record<string, unknown>[], { currentMessage }: { currentMessage: any }) => {
    currentMessage.renderContent.push({ type: 'loading', content: '' })
  }

  const onConversationEnd = (_conversationId: string) => {
    // Agent 模式暂无特殊处理
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
