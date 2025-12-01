import { nextTick } from 'vue'
import { STATUS, type ChatMessage } from '@opentiny/tiny-robot-kit'
import { formatMessages, removeLoading, serializeError } from '../utils'
import { getClientConfig as getConfig, updateClientConfig as updateConfig, client } from '../services/aiClient'
import useModelConfig from './core/useConfig'
import useMode from './modes/useMode'
import { createStreamDataHandler } from './core/useMessageStream'
import type { ChatRequestData, ProviderConfig } from '../services/OpenAICompatibleProvider'
import { createToolCallHandler } from './features/useToolCalls'
import apiService from '../services/api'
import { useConversationAdapter } from './core/useConversation'

const {
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
} = useMode()

const { robotSettingState, updateChatModeState, getSelectedModelInfo } = useModelConfig()

// 本次对话的状态，从用户发送消息开始到AI返回或用户主动终止结束
enum CHAT_STATUS {
  IDLE = 'idle', // 本轮对话开始后，没有请求在流式返回（可能是等待请求，也可能是请求间隙）
  STREAMING = 'streaming', // 当前有请求正在流式返回
  FINISHED = 'finished' // 本轮对话结束
}

let chatStatus: CHAT_STATUS = CHAT_STATUS.IDLE

const abortControllerMap: Record<string, AbortController> = {}

// 使用工厂函数创建流式数据处理器，解耦业务逻辑
const handleStreamData = createStreamDataHandler({
  getContentType,
  hooks: {
    onStreamStart,
    onStreamData,
    onStreamTools
  },
  statusManager: {
    isStreaming: () => chatStatus === CHAT_STATUS.STREAMING,
    setStreaming: () => {
      chatStatus = CHAT_STATUS.STREAMING
    }
  }
})

const beforeRequest = async (params: ChatRequestData): Promise<ChatRequestData> => {
  const requestParams = await onBeforeRequest(params)
  const { service } = getSelectedModelInfo()

  if (getConfig().apiKey !== service!.apiKey) {
    updateConfig({ apiKey: service!.apiKey })
  }
  if (getConfig().apiUrl !== getApiUrl()) {
    updateConfig({ apiUrl: getApiUrl() })
  }
  return requestParams
}

const initChatClient = () => {
  const { service, model } = getSelectedModelInfo()

  const config: ProviderConfig = {
    apiKey: service?.apiKey || '',
    apiUrl: getApiUrl(),
    defaultModel: model || 'deepseek-v3',
    axiosClient: () => apiService.getHttpClient(),
    httpClientType: 'axios',
    beforeRequest
  }
  updateConfig(config)
}

const handleFinishRequest = async (finishReason, messages, contextMessages, messageState) => {
  chatStatus = CHAT_STATUS.IDLE
  const lastMessage = messages.at(-1)

  await onRequestEnd(finishReason, lastMessage.content, messages) // 本次请求结束

  if (finishReason === 'tool_calls' && lastMessage.tool_calls?.length) {
    await handleToolCall(lastMessage.tool_calls, messages, contextMessages) // eslint-disable-line
  }

  if (finishReason === 'aborted' || messageState?.status === STATUS.ABORTED) {
    messageState.status = STATUS.ABORTED
  } else {
    messageState.status = STATUS.FINISHED
  }

  chatStatus = CHAT_STATUS.FINISHED
}

const handleRequestError = async (error, messages, messageState) => {
  chatStatus = CHAT_STATUS.FINISHED

  await onRequestEnd('error', messages.at(-1).content, messages) // 本次请求结束

  messages.at(-1)!.renderContent.push({ type: 'text', content: serializeError(error) })

  messageState.status = STATUS.ERROR
}

// 使用 conversation 适配器，将业务逻辑与 conversation 管理解耦
const {
  messageManager,
  conversationState,
  createConversation: createConversationBase,
  switchConversation: switchConversationBase,
  autoSetTitle: autoSetTitleBase,
  ...conversationMethods
} = useConversationAdapter({
  client,
  onStreamData: handleStreamData,
  onFinishRequest: handleFinishRequest,
  onMessageProcessed: async (finishReason, content, messages) => {
    await onMessageProcessed(finishReason, content, messages, { abortControllerMap })
  }
})

// 使用工厂函数创建工具调用处理器
const handleToolCall = createToolCallHandler({
  client,
  getAbortController: () => {
    abortControllerMap.toolCall = new AbortController()
    return abortControllerMap.toolCall
  },
  formatMessages,
  hooks: {
    onBeforeCallTool,
    onPostCallTool,
    onPostCallTools
  },
  streamHandlers: {
    onData: handleStreamData,
    onError: handleRequestError,
    onDone: handleFinishRequest
  },
  getMessageState: () => messageManager.messageState
})

// 包装 conversation 方法，添加业务特定逻辑
const createConversation = (title = '新会话', chatMode = robotSettingState.chatMode) => {
  onConversationEnd(conversationState.currentId!)
  return createConversationBase(title, { chatMode })
}

const switchConversation = (conversationId: string) => {
  onConversationEnd(conversationState.currentId!)
  return switchConversationBase(conversationId, (state, messages, methods) => {
    onConversationStart(state, messages, methods)
  })
}

const autoSetTitle = () => {
  if (conversationState.currentId) {
    autoSetTitleBase(conversationState.currentId)
  }
}

const sendUserMessage = async () => {
  try {
    nextTick(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: '',
        renderContent: [{ type: getLoadingType() }]
      }
      messageManager.messages.value.push(assistantMessage)
    })
    await messageManager.send()
    onMessageSent()
    autoSetTitle()
  } catch (error) {
    removeLoading(messageManager.messages.value)
    const lastMessage = messageManager.messages.value.at(-1)
    if (lastMessage) {
      lastMessage.renderContent.push({ type: 'text', content: serializeError(error) })
    }
    // eslint-disable-next-line no-console
    console.error(error)
  }
}

const abortRequest = () => {
  Object.values(abortControllerMap).forEach((controller) => controller?.abort())
  for (const key of Object.keys(abortControllerMap)) {
    delete abortControllerMap[key]
  }

  messageManager.abortRequest()
  messageManager.messageState.status = STATUS.ABORTED
  onRequestEnd('aborted', messageManager.messages.value.at(-1)?.content as string, messageManager.messages.value)
}

const changeChatMode = (chatMode: string) => {
  // 空会话更新metadata
  const usedConversationId = conversationState.currentId
  const newConversationId = createConversation('新会话', chatMode)
  if (usedConversationId === newConversationId) {
    conversationMethods.updateMetadata(newConversationId, { chatMode })
    conversationMethods.saveConversations()
  }

  updateChatModeState(chatMode)
  updateConfig({ apiUrl: getApiUrl() })
}

export default function () {
  return {
    initChatClient,
    updateConfig,
    ...messageManager,
    sendUserMessage,
    changeChatMode,
    abortRequest,
    conversationState,
    ...conversationMethods,
    switchConversation,
    createConversation,
    autoSetTitle
  }
}
