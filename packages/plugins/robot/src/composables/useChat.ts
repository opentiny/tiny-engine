import { toRaw } from 'vue'
import { getMetaApi, META_SERVICE, useCanvas } from '@opentiny/tiny-engine-meta-register'
import type { BubbleContentItem } from '@opentiny/tiny-robot'
import {
  STATUS,
  useConversation,
  type AIModelConfig,
  type ChatCompletionStreamResponse,
  type ChatCompletionStreamResponseChoice,
  type ChatMessage,
  type UseMessageOptions
} from '@opentiny/tiny-robot-kit'
import { utils } from '@opentiny/tiny-engine-utils'
import { formatMessages, serializeError } from '../utils/common-utils'
import type { LLMMessage, ResponseToolCall, RobotMessage } from '../types/mcp-types'
import { createClient } from '../client'
import useMcpServer from './useMcp'
import { updatePageSchema, fetchAssets } from './agent'
import useRobot from './useRobot'
import { getAgentSystemPrompt } from '../prompts'

const { deepClone } = utils

type Message = ChatMessage & {
  renderContent: BubbleContentItem[]
  tool_calls: ResponseToolCall[]
}

const { robotSettingState, CHAT_MODE, saveRobotSettingState } = useRobot()

const getApiUrl = () => {
  return robotSettingState.chatMode === CHAT_MODE.Agent ? '/app-center/api/ai/chat' : '/app-center/api/chat/completions'
}

const config: Omit<AIModelConfig, 'provider' | 'providerImplementation'> & {
  axiosClient?: unknown
  httpClientType?: 'axios' | 'fetch'
} = {
  apiKey: robotSettingState.selectedModel.apiKey || '',
  apiUrl: getApiUrl(),
  defaultModel: robotSettingState.selectedModel.model || 'deepseek-v3',
  axiosClient: () => getMetaApi(META_SERVICE.Http)?.getHttp(),
  httpClientType: 'axios'
}

const addSystemPrompt = (messages: LLMMessage[], prompt: string = '') => {
  if (!messages.length || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: prompt })
  } else if (messages[0].role === 'system' && messages[0].content !== prompt) {
    messages[0].content = prompt
  }
}

const beforeRequest = async (requestParams: any) => {
  const { CHAT_MODE, robotSettingState, getModelCapabilities } = useRobot()
  const pageSchema = deepClone(useCanvas().pageState.pageSchema)
  const isAgentMode = robotSettingState.chatMode === CHAT_MODE.Agent
  const tools = await useMcpServer().getLLMTools()
  const modelCapabilities = getModelCapabilities(
    robotSettingState.selectedModel.baseUrl,
    robotSettingState.selectedModel.model
  )
  if (!requestParams.tools && tools?.length && !isAgentMode && modelCapabilities?.tools) {
    Object.assign(requestParams, { tools })
  }
  if (isAgentMode) {
    requestParams.apiKey = robotSettingState.selectedModel.apiKey
    const referenceContext = ''
    // if (requestParams.messages?.[0].role && requestParams.messages?.[0].role !== 'system') {
    //   referenceContext = await search(requestParams.messages?.at(-1)?.content)
    // }
    const imageAssets = await fetchAssets()
    addSystemPrompt(requestParams.messages, getAgentSystemPrompt(pageSchema, referenceContext, imageAssets))
    if (!robotSettingState.enableThinking) {
      Object.assign(requestParams, { response_format: { type: 'json_object' } })
    }
  }
  requestParams.baseUrl = robotSettingState.selectedModel.baseUrl
  requestParams.model = robotSettingState.selectedModel.model
  if (modelCapabilities?.thinking?.extraBody) {
    Object.assign(
      requestParams,
      robotSettingState.enableThinking
        ? modelCapabilities.thinking.extraBody.enable
        : modelCapabilities.thinking.extraBody.disable
    )
  }
  if (config.apiKey !== robotSettingState.selectedModel.apiKey) {
    provider?.updateConfig({ apiKey: robotSettingState.selectedModel.apiKey }) // eslint-disable-line
    config.apiKey = robotSettingState.selectedModel.apiKey
  }
  return requestParams
}

const { client, provider } = createClient({ config, beforeRequest })
window.client = client

const updateLLMConfig = (newConfig: Omit<AIModelConfig, 'provider' | 'providerImplementation'>) => {
  provider?.updateConfig(newConfig)
  Object.assign(config, newConfig)
}

const removeLoading = (messages: ChatMessage[], name?: string) => {
  const lastMessage = messages.at(-1)
  if (name === 'latest' && lastMessage.renderContent?.at(-1)?.type === 'loading') {
    lastMessage.renderContent.pop()
    return
  }
  const index = lastMessage.renderContent?.findIndex(
    (item) => item.type === 'loading' && (name ? item.content === name : true)
  )
  if (index !== -1) {
    lastMessage.renderContent?.splice(index, 1)
  }
}

let chatStatus = STATUS.INIT
let pageSchema = null

const events: UseMessageOptions['events'] = {
  onReceiveData: (data: ChatCompletionStreamResponse, messages, preventDefault) => {
    preventDefault()
    const choice = data.choices?.[0]
    if (!choice) {
      return
    }
    if (chatStatus !== STATUS.STREAMING) {
      chatStatus = STATUS.STREAMING
      pageSchema = deepClone(useCanvas().pageState.pageSchema)
    }
    const lastMessage = messages.value.at(-1)
    if (choice.delta.reasoning_content || choice.delta.content || choice.delta.tool_calls?.length) {
      removeLoading(messages.value, 'latest')
    }
    handleDeltaReasoning(choice, lastMessage) // eslint-disable-line
    handleDeltaContent(choice, lastMessage) // eslint-disable-line
    handleDeltaToolCalls(choice, lastMessage) // eslint-disable-line

    updatePageSchema(lastMessage.content, pageSchema)
  },
  onFinish(finishReason, { messages, messageState }, preventDefault) {
    preventDefault()
    const lastMessage = messages.value.at(-1)
    if (finishReason === 'tool_calls') {
      handleToolCall(lastMessage.tool_calls, messages.value) // eslint-disable-line
    } else if (finishReason !== 'abort' && messageState.status !== STATUS.ABORTED) {
      messageState.status = STATUS.FINISHED
      if (robotSettingState.chatMode === CHAT_MODE.Agent) {
        updatePageSchema(lastMessage.content, pageSchema, true).then(({ schema: newSchema } = { schema: null }) => {
          // TODO: isError时让AI继续修复
          if (newSchema) {
            messages.value.at(-1).renderContent.at(-1).status = 'success'
            messages.value.at(-1).renderContent.at(-1).schema = newSchema
          } else {
            messages.value.at(-1).renderContent.at(-1).status = 'failed'
          }
        })
      }
    }
    chatStatus = messageState.status
    pageSchema = null
  }
}

const { messageManager, state: conversationState, createConversation, ...rest } = useConversation({ client, events })

const getMessageManager = () => messageManager

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
    lastMessage.renderContent.at(-1).content += choice.delta.reasoning_content
  }
}

const handleDeltaContent = (choice: ChatCompletionStreamResponseChoice, lastMessage: Message) => {
  if (typeof choice.delta.content === 'string' && choice.delta.content) {
    if (lastMessage.renderContent.at(-1)?.contentType === 'reasoning') {
      lastMessage.renderContent.at(-1).status = 'finish'
    }
    if (lastMessage.renderContent.at(-1)?.type !== 'markdown') {
      lastMessage.renderContent.push({ type: 'markdown', content: '' })
      lastMessage.content = ''
    }
    lastMessage.renderContent.at(-1).content += choice.delta.content
    lastMessage.content += choice.delta.content
  }
}

/**
 * 合并字符串字段。如果值是对象，则递归合并字符串字段
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
const mergeStringFields = (target: Record<string, any>, source: Record<string, any>) => {
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

const parseArgs = (args: string) => {
  try {
    return JSON.parse(args)
  } catch (error) {
    return args
  }
}

let afterToolCallAbortController: AbortController | null = null

const handleToolCall = async (
  tool_calls: ResponseToolCall[],
  messages: ChatMessage[],
  contextMessages?: RobotMessage[]
) => {
  const hasToolCall = tool_calls?.length > 0
  if (!hasToolCall) {
    return
  }

  afterToolCallAbortController = new AbortController()

  const currentMessage = messages.at(-1)
  const historyMessages = contextMessages?.length ? contextMessages : messages.slice(0, -1)
  const toolMessages: LLMMessage[] = formatMessages([...historyMessages, toRaw(currentMessage)])
  for (const tool of tool_calls) {
    const { name, arguments: args } = tool.function
    const parsedArgs = parseArgs(args)
    const currentToolMessage = {
      type: 'tool',
      name,
      status: 'running',
      content: {
        params: parsedArgs
      },
      formatPretty: true
    }
    currentMessage.renderContent.push(currentToolMessage)
    let toolCallResult: string
    let toolCallStatus: 'success' | 'failed'
    try {
      const resp = await useMcpServer().callTool(name, parsedArgs)
      toolCallStatus = 'success'
      toolCallResult = resp.content
    } catch (error) {
      toolCallStatus = 'failed'
      toolCallResult = serializeError(error)
    }
    toolMessages.push({
      content: JSON.stringify(toolCallResult),
      role: 'tool',
      tool_call_id: tool.id
    })
    currentMessage.renderContent.at(-1)!.status = toolCallStatus
    currentMessage.renderContent.at(-1)!.content = {
      params: parsedArgs,
      result: toolCallResult
    }

    if (afterToolCallAbortController?.signal?.aborted) {
      return
    }
  }
  delete currentMessage.tool_calls
  currentMessage.renderContent.push({ type: 'loading', content: '' })

  await client.chatStream(
    { messages: toolMessages, options: { signal: afterToolCallAbortController?.signal } },
    {
      onData: (data) => {
        if (
          data.choices[0].delta.reasoning_content ||
          data.choices[0].delta.content ||
          data.choices[0].delta.tool_calls?.length
        ) {
          removeLoading(messages, 'latest')
        }
        if (data.choices[0].delta.reasoning_content) {
          handleDeltaReasoning(data.choices[0], currentMessage)
        }
        if (data.choices[0].delta.content) {
          handleDeltaContent(data.choices[0], currentMessage)
        }
        if (data.choices[0].delta.tool_calls?.length) {
          handleDeltaToolCalls(data.choices[0], currentMessage)
        }
      },
      onError: (error) => {
        removeLoading(messages)
        messages.at(-1)!.renderContent.push({ type: 'text', content: serializeError(error) })
        // eslint-disable-next-line no-console
        console.error(error)
        getMessageManager().messageState.status = STATUS.ERROR
      },
      onDone: async () => {
        removeLoading(messages, 'latest')
        const toolCalls = messages.at(-1)!.tool_calls
        if (toolCalls?.length) {
          await handleToolCall(toolCalls, messages, toolMessages)
        } else {
          getMessageManager().messageState.status = STATUS.FINISHED
        }
      }
    }
  )
}

const changeChatMode = (chatMode: string) => {
  // 空会话更新metadata
  const usedConversationId = conversationState.currentId
  const newConversationId = createConversation('新会话', { chatMode })
  if (usedConversationId === newConversationId) {
    rest.updateMetadata(newConversationId, { chatMode })
    rest.saveConversations()
  }

  robotSettingState.chatMode = chatMode
  saveRobotSettingState({ chatMode })
  updateLLMConfig({ apiUrl: getApiUrl() })
}

export default function () {
  return {
    updateLLMConfig,
    conversationState,
    ...messageManager,
    changeChatMode,
    abortRequest: () => {
      afterToolCallAbortController?.abort()
      messageManager.abortRequest()
      messageManager.messageState.status = STATUS.ABORTED
      removeLoading(messageManager.messages.value, 'latest')
    },
    ...rest,
    switchConversation: (conversationId: string) => {
      const conversation = conversationState.conversations.find((conversation) => conversation.id === conversationId)
      if (!conversation) return

      rest.switchConversation(conversationId)
      // 切换会话后跟随切换对话模式
      if (conversation.metadata?.chatMode) {
        robotSettingState.chatMode = conversation.metadata.chatMode as string
      } else {
        robotSettingState.chatMode = CHAT_MODE.Agent
        rest.updateMetadata(conversationId, { chatMode: CHAT_MODE.Agent })
        rest.saveConversations()
      }
    },
    createConversation: (title?: string) => {
      createConversation(title, { chatMode: robotSettingState.chatMode })
    },
    removeLoading
  }
}
