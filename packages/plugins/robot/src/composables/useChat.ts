import { nextTick } from 'vue'
import { GeneratingStatus, STATUS, type ChatMessage, type MessageState } from '@opentiny/tiny-robot-kit'
import { formatMessages, removeLoading } from '../utils'
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
  PROCESSING = 'processing', // 本轮对话开始后，没有请求在流式返回（可能是等待请求，也可能是请求间隙）
  STREAMING = 'streaming', // 当前有请求正在流式返回
  FINISHED = 'finished' // 本轮对话结束
}

let chatStatus: CHAT_STATUS = CHAT_STATUS.PROCESSING

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

  if (service && getConfig().apiKey !== service.apiKey) {
    updateConfig({ apiKey: service.apiKey })
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

const handleFinishRequest = async (
  finishReason: string,
  messages: ChatMessage[],
  contextMessages: ChatMessage[],
  messageState: MessageState
) => {
  const lastMessage = messages.at(-1)

  delete abortControllerMap.main
  await onRequestEnd(finishReason, lastMessage.content, messages) // 本次请求结束

  if (finishReason === 'tool_calls' && lastMessage.tool_calls?.length) {
    await handleToolCall(lastMessage.tool_calls, messages, contextMessages) // eslint-disable-line
  }

  if (finishReason === 'aborted' || messageState?.status === STATUS.ABORTED) {
    messageState.status = STATUS.ABORTED
  }
}

const handleRequestError = async (error: Error, messages: ChatMessage[], messageState: MessageState) => {
  chatStatus = CHAT_STATUS.FINISHED
  delete abortControllerMap.main
  await onRequestEnd('error', messages.at(-1).content, messages, { error }) // 本次请求结束
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
    await onMessageProcessed(finishReason, content, messages, {
      abortControllerMap,
      messageState: messageManager.messageState
    })
    if (GeneratingStatus.includes(messageManager.messageState.status)) {
      messageManager.messageState.status = STATUS.FINISHED
    }
    chatStatus = CHAT_STATUS.FINISHED
  },
  statusManager: {
    isProcessing: () => chatStatus === CHAT_STATUS.PROCESSING,
    setProcessing: () => {
      chatStatus = CHAT_STATUS.PROCESSING
    }
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
  const currentConversationId = conversationState.currentId!
  const newConversationId = createConversationBase(title, { chatMode })
  if (newConversationId !== currentConversationId) {
    onConversationEnd(currentConversationId)
  }
  onConversationStart(conversationState, messageManager.messages.value, conversationMethods)
  return newConversationId
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

const addMainAbortController = () => {
  const mainAbortController = new AbortController()
  mainAbortController.signal.addEventListener('abort', () => {
    messageManager.abortRequest()
    messageManager.messageState.status = STATUS.ABORTED
  })
  abortControllerMap.main = mainAbortController
}

const addLoading = (messages: ChatMessage[]) => {
  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: '',
    renderContent: [{ type: getLoadingType() }]
  }
  messages.push(assistantMessage)
}

const sendUserMessage = async () => {
  onMessageSent()
  await nextTick()
  addMainAbortController()
  addLoading(messageManager.messages.value)
  await messageManager.send()
  if (messageManager.messageState.status === STATUS.ERROR) {
    removeLoading(messageManager.messages.value)
    await handleRequestError(
      messageManager.messageState.errorMsg,
      messageManager.messages.value,
      messageManager.messageState
    )
  }
  autoSetTitle()
}

const abortRequest = () => {
  Object.values(abortControllerMap).forEach((controller) => controller?.abort())
  for (const key of Object.keys(abortControllerMap)) {
    delete abortControllerMap[key]
  }

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
