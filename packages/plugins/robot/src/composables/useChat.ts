import { nextTick, ref, computed } from 'vue'
import type { ChatMessage } from '@opentiny/tiny-robot-kit'
import { GeneratingStatus, STATUS, type MessageState } from '../constants/status'
import { formatMessages } from '../utils'
import { getClientConfig as getConfig, updateClientConfig as updateConfig, provider } from '../services/aiClient'
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

const chatStatus = ref<CHAT_STATUS>(CHAT_STATUS.FINISHED)

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
    isStreaming: () => chatStatus.value === CHAT_STATUS.STREAMING,
    setStreaming: () => {
      chatStatus.value = CHAT_STATUS.STREAMING
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
  if (!lastMessage) {
    chatStatus.value = CHAT_STATUS.FINISHED
    return
  }

  try {
    delete abortControllerMap.main
    lastMessage.loading = undefined
    await onRequestEnd(finishReason, lastMessage.content, messages) // 本次请求结束

    // 部分模型返回格式不太标准，例如finishReason没有返回tool_calls而是stop，这里做下兼容
    if (
      ['tool_calls', 'stop', 'unknown'].includes(finishReason) &&
      lastMessage.tool_calls?.length &&
      !lastMessage.state?.toolsHandled
    ) {
      lastMessage!.tool_calls.forEach((toolCall) => {
        if (toolCall.type !== 'function') {
          // 修复，兼容部分场景返回格式不标准，流式中多次返回type字段
          toolCall.type = 'function'
        }
      })
      await handleToolCall(lastMessage.tool_calls, messages, contextMessages) // eslint-disable-line
      return
    }

    if (finishReason === 'aborted' || messageState?.status === STATUS.ABORTED) {
      messageState.status = STATUS.ABORTED
      await onMessageProcessed('aborted', lastMessage.content ?? '', messages, {
        abortControllerMap,
        messageState
      })
    } else if (!lastMessage.tool_calls?.length || lastMessage.state?.toolsHandled) {
      messageState.status = STATUS.FINISHED
      await onMessageProcessed(finishReason, lastMessage.content ?? '', messages, {
        abortControllerMap,
        messageState
      })
    }
  } finally {
    if (GeneratingStatus.includes(messageState.status)) {
      messageState.status = STATUS.FINISHED
    }
    const currentMessage = messages.at(-1)
    if (currentMessage) {
      currentMessage.loading = undefined
    }
    chatStatus.value = CHAT_STATUS.FINISHED
  }
}

const handleRequestError = async (error: unknown, messages: ChatMessage[], messageState: MessageState) => {
  chatStatus.value = CHAT_STATUS.FINISHED
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
  provider,
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
    chatStatus.value = CHAT_STATUS.FINISHED
  },
  statusManager: {
    isProcessing: () => chatStatus.value === CHAT_STATUS.PROCESSING,
    setProcessing: () => {
      chatStatus.value = CHAT_STATUS.PROCESSING
    },
    resetProcessing: () => {
      chatStatus.value = CHAT_STATUS.FINISHED
    }
  }
})

// 使用工厂函数创建工具调用处理器
const handleToolCall = createToolCallHandler({
  provider,
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
  getMessageState: () => messageManager.messageState,
  statusManager: {
    isProcessing: () => chatStatus.value === CHAT_STATUS.PROCESSING,
    setProcessing: () => {
      chatStatus.value = CHAT_STATUS.PROCESSING
    },
    resetProcessing: () => {
      chatStatus.value = CHAT_STATUS.FINISHED
    }
  }
})

const hasActiveRequest = () => {
  return chatStatus.value !== CHAT_STATUS.FINISHED || Object.keys(abortControllerMap).length > 0
}

const abortRequest = () => {
  Object.values(abortControllerMap).forEach((controller) => controller?.abort())
  for (const key of Object.keys(abortControllerMap)) {
    delete abortControllerMap[key]
  }
  chatStatus.value = CHAT_STATUS.FINISHED
  messageManager.messageState.status = STATUS.ABORTED

  void onRequestEnd(
    'aborted',
    messageManager.messages.value.at(-1)?.content as string,
    messageManager.messages.value
  ).finally(() => {
    if (conversationState.currentId) {
      conversationMethods.saveMessages(conversationState.currentId)
    }
  })
}

const interruptActiveRequest = () => {
  if (!hasActiveRequest()) {
    return
  }

  abortRequest()
}

const restoreConversationMessagesState = (conversationId: string, messages: ChatMessage[]) => {
  try {
    const conversations = JSON.parse(localStorage.getItem('tiny-robot-ai-conversations') || '[]')
    const conversation = conversations.find((item: any) => item.id === conversationId)
    if (!conversation?.messages?.length) {
      return
    }

    messages.forEach((message: any, index) => {
      const storedMessage = conversation.messages[index]
      if (!storedMessage) {
        return
      }

      if (Array.isArray(storedMessage.renderContent) && storedMessage.renderContent.length) {
        message.renderContent = storedMessage.renderContent
      }
      if (storedMessage.metadata?.agentStatus) {
        message.metadata = {
          ...(message.metadata || {}),
          agentStatus: storedMessage.metadata.agentStatus
        }
      }
    })
  } catch (error) {
    // 忽略历史消息状态恢复失败，继续使用 tiny-robot-kit 加载出的消息。
  }
}

// 包装 conversation 方法，添加业务特定逻辑
const createConversationWithMode = (title = '新会话', chatMode = robotSettingState.chatMode) => {
  const currentConversationId = conversationState.currentId!
  const newConversationId = createConversationBase(title, { chatMode })
  if (newConversationId !== currentConversationId) {
    onConversationEnd(currentConversationId)
  }
  onConversationStart(conversationState, messageManager.messages.value, conversationMethods)
  return newConversationId
}

const createConversation = (title = '新会话', chatMode = robotSettingState.chatMode) => {
  interruptActiveRequest()
  return createConversationWithMode(title, chatMode)
}

const switchConversation = (conversationId: string) => {
  interruptActiveRequest()
  onConversationEnd(conversationState.currentId!)
  return switchConversationBase(conversationId, (state, messages, methods) => {
    const conversation = state.conversations.find((item: any) => item.id === state.currentId)
    if (conversation?.metadata?.chatMode) {
      updateChatModeState(conversation.metadata.chatMode)
      updateConfig({ apiUrl: getApiUrl() })
      restoreConversationMessagesState(state.currentId, messages)
      messages.forEach((message: any) => {
        message.metadata = {
          ...(message.metadata || {}),
          chatMode: conversation.metadata.chatMode
        }
      })
    }
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

const sendUserMessage = async () => {
  onMessageSent()
  await nextTick()
  messageManager.messageState.status = STATUS.PENDING
  messageManager.messageState.errorMsg = undefined
  addMainAbortController()
  await messageManager.send()
  if (messageManager.messageState.status === STATUS.ERROR) {
    await handleRequestError(
      messageManager.messageState.errorMsg,
      messageManager.messages.value,
      messageManager.messageState
    )
  }
  autoSetTitle()
}

const changeChatMode = (chatMode: string) => {
  if (chatMode === robotSettingState.chatMode) {
    return
  }

  interruptActiveRequest()
  updateChatModeState(chatMode)

  // 空会话更新metadata
  const usedConversationId = conversationState.currentId
  const newConversationId = createConversationWithMode('新会话', chatMode)
  if (usedConversationId === newConversationId) {
    conversationMethods.updateMetadata(newConversationId, { chatMode })
  }

  updateConfig({ apiUrl: getApiUrl() })
}

// 将 CHAT_STATUS 映射到 STATUS 枚举，用于 UI 显示
const mappedStatus = computed(() => {
  const statusMap: Record<CHAT_STATUS, STATUS> = {
    [CHAT_STATUS.PROCESSING]: STATUS.PENDING,
    [CHAT_STATUS.STREAMING]: STATUS.STREAMING,
    [CHAT_STATUS.FINISHED]: STATUS.FINISHED
  }
  return statusMap[chatStatus.value] || STATUS.FINISHED
})

export default function () {
  return {
    mappedStatus,
    chatStatus,
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
