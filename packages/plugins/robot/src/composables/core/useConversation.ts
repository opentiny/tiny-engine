import { computed, reactive, ref, toRaw } from 'vue'
import {
  localStorageStrategyFactory,
  useConversation as useConversationKit,
  type ChatCompletion,
  type ChatMessage,
  type ConversationInfo,
  type ConversationStorageStrategy,
  type UseMessageOptions,
  type UseMessagePlugin
} from '@opentiny/tiny-robot-kit'
import type { CompletionChoice } from '@opentiny/tiny-robot-kit'
import { STATUS, type MessageState } from '../../constants/status'
import type { OpenAICompatibleProvider } from '../../services/OpenAICompatibleProvider'

export interface ConversationAdapterOptions {
  provider: Pick<OpenAICompatibleProvider, 'chatStream'>
  // 业务回调函数
  onStreamData: (data: any, messages: any[]) => void
  onFinishRequest: (finishReason: string, messages: any[], contextMessages: any[], messageState: any) => Promise<void>
  onMessageProcessed: (finishReason: string, content: any, messages: any[], context: any) => Promise<void>
  statusManager: {
    isProcessing: () => boolean
    setProcessing: () => void
    resetProcessing: () => void
  }
}

export interface ConversationMetadata {
  chatMode?: string
  [key: string]: any
}

let currentConversationMetadata: ConversationMetadata = {}

const createResponseProvider = (
  provider: Pick<OpenAICompatibleProvider, 'chatStream'>
): UseMessageOptions['responseProvider'] => {
  return async function* responseProvider(requestBody, abortSignal) {
    const queue: ChatCompletion[] = []
    let streamError: unknown
    let finished = false
    let wakeUp: (() => void) | undefined
    const notify = () => {
      wakeUp?.()
      wakeUp = undefined
    }
    const handleAbort = () => {
      finished = true
      notify()
    }

    abortSignal.addEventListener('abort', handleAbort, { once: true })

    const streamTask = provider
      .chatStream(
        { messages: requestBody.messages as ChatMessage[], options: { signal: abortSignal } },
        {
          onData: (data) => {
            queue.push(data as ChatCompletion)
            notify()
          },
          onError: (error) => {
            streamError = error
            finished = true
            notify()
          },
          onDone: () => {
            finished = true
            notify()
          }
        }
      )
      .catch((error) => {
        streamError = error
        finished = true
        notify()
      })

    try {
      while (!finished || queue.length > 0) {
        if (queue.length === 0) {
          await new Promise<void>((resolve) => {
            wakeUp = resolve
          })
          continue
        }

        yield queue.shift() as ChatCompletion
      }

      if (streamError) {
        throw streamError
      }
    } finally {
      abortSignal.removeEventListener('abort', handleAbort)
      await streamTask
    }
  }
}

const updateMessageMetadata = (currentMessage: ChatMessage, chunk: ChatCompletion, choice?: CompletionChoice) => {
  currentMessage.role = choice?.delta?.role || choice?.message?.role || currentMessage.role || 'assistant'
  currentMessage.loading = undefined
  currentMessage.renderContent ||= []
  currentMessage.metadata ||= {}
  currentMessage.metadata.chatMode ||= currentConversationMetadata.chatMode
  currentMessage.metadata.createdAt ||= chunk.created
  currentMessage.metadata.updatedAt = Math.floor(Date.now() / 1000)
  currentMessage.metadata.id ||= chunk.id
  currentMessage.metadata.model ||= chunk.model
}

/**
 * Conversation 适配器
 * 基于 tiny-robot-kit v0.4 的 useConversation/useMessage，对外保持旧业务层接口
 */
export function useConversationAdapter(options: ConversationAdapterOptions) {
  const { provider, onStreamData, onFinishRequest, statusManager } = options

  const storage: ConversationStorageStrategy = localStorageStrategyFactory()
  const messageState = reactive<MessageState>({
    status: STATUS.FINISHED
  })
  const emptyMessages = ref<ChatMessage[]>([])

  const adapterPlugin: UseMessagePlugin = {
    name: 'robot-conversation-adapter',
    async onAfterRequest({ messages, lastChoice }) {
      if (statusManager.isProcessing()) {
        return
      }

      statusManager.setProcessing()
      const finishReason = lastChoice?.finish_reason || 'stop'
      const contextMessages = toRaw(messages.slice(0, -1))

      await onFinishRequest(finishReason, messages, contextMessages, messageState)
    },
    onError({ error }) {
      messageState.status = STATUS.ERROR
      messageState.errorMsg = error
    }
  }

  const {
    conversations,
    activeConversationId,
    activeConversation,
    createConversation: createConversationKit,
    switchConversation: switchConversationKit,
    deleteConversation,
    clear,
    updateConversationTitle,
    saveMessages,
    abortActiveRequest
  } = useConversationKit({
    autoSaveMessages: true,
    storage,
    useMessageOptions: {
      responseProvider: createResponseProvider(provider),
      plugins: [adapterPlugin],
      onCompletionChunk({ currentMessage, messages, chunk, choice }, runDefault) {
        runDefault()
        updateMessageMetadata(currentMessage, chunk, choice)
        onStreamData({ ...chunk, __contentAlreadyMerged: true }, messages)
      }
    }
  })

  const getActiveEngine = () => activeConversation.value?.engine

  const saveConversation = (conversation: ConversationInfo) => {
    const rawConversation = {
      ...toRaw(conversation),
      metadata: toRaw(conversation.metadata)
    }
    return storage.saveConversation?.(rawConversation)
  }

  const saveConversations = () => {
    conversations.value.forEach((conversation) => {
      void saveConversation(conversation)
    })
  }

  const updateMetadata = (conversationId: string, metadata: ConversationMetadata = {}) => {
    const conversation = conversations.value.find((item) => item.id === conversationId)
    if (!conversation) {
      return
    }

    conversation.metadata = {
      ...(conversation.metadata || {}),
      ...metadata
    }
    if (conversationId === activeConversationId.value) {
      currentConversationMetadata = conversation.metadata
    }
    conversation.updatedAt = Date.now()
    void saveConversation(conversation)
  }

  const updateTitle = (conversationId: string, title?: string) => {
    updateConversationTitle(conversationId, title)
  }

  const isConversationEmpty = (conversationId?: string | null) => {
    if (!conversationId || conversationId !== activeConversationId.value) {
      return false
    }

    const messages = getActiveEngine()?.messages.value || []
    return !messages.some(
      (message) =>
        message.role !== 'system' &&
        (message.content ||
          message.tool_calls?.length ||
          message.tool_call_id ||
          (Array.isArray(message.renderContent) && message.renderContent.length))
    )
  }

  const conversationState = reactive({
    get currentId() {
      return activeConversationId.value
    },
    get conversations() {
      return conversations.value
    }
  })

  const messageManager = {
    messages: computed(() => getActiveEngine()?.messages.value ?? emptyMessages.value),
    messageState,
    sendMessage: (content: string) => getActiveEngine()?.sendMessage(content) ?? Promise.resolve(),
    send: (...msgs: ChatMessage[]) => getActiveEngine()?.send(...msgs) ?? Promise.resolve(),
    abortRequest: () => abortActiveRequest()
  }

  /**
   * 创建新会话
   * @param title 会话标题
   * @param metadata 会话元数据（如 chatMode）
   */
  const createConversation = (title: string, metadata?: ConversationMetadata) => {
    if (isConversationEmpty(activeConversationId.value)) {
      const currentId = activeConversationId.value as string
      const conversation = conversations.value.find((item) => item.id === currentId)

      if (conversation) {
        conversation.title = title
        conversation.updatedAt = Date.now()
        if (metadata) {
          conversation.metadata = {
            ...(conversation.metadata || {}),
            ...metadata
          }
        }
        currentConversationMetadata = conversation.metadata || {}
        void saveConversation(conversation)
        return currentId
      }
    }

    const conversation = createConversationKit({ title, metadata })
    currentConversationMetadata = conversation.metadata || {}
    return conversation.id
  }

  /**
   * 切换会话
   * @param conversationId 会话ID
   * @param onStart 切换成功后的回调
   */
  const switchConversation = async (
    conversationId: string,
    onStart?: (state: any, messages: any, methods: any) => void
  ) => {
    const conversation = conversations.value.find((item) => item.id === conversationId)
    if (!conversation) {
      return null
    }

    const result = await switchConversationKit(conversationId)

    if (result && onStart) {
      currentConversationMetadata = conversation.metadata || {}
      onStart(conversationState, messageManager.messages.value, {
        createConversation,
        switchConversation,
        deleteConversation,
        clear,
        saveMessages,
        saveConversations,
        updateTitle,
        updateMetadata,
        abortActiveRequest
      })
    }

    return result
  }

  const apis = {
    createConversation,
    switchConversation,
    deleteConversation,
    clear,
    saveMessages,
    saveConversations,
    updateTitle,
    updateMetadata,
    abortActiveRequest
  }

  /**
   * 自动设置会话标题
   * @param currentId 当前会话ID
   * @param defaultTitle 默认标题
   */
  const autoSetTitle = (currentId: string, defaultTitle = '新会话') => {
    const currentConversation = conversations.value.find((conversation) => conversation.id === currentId)
    if (!currentConversation || currentId !== activeConversationId.value) {
      return
    }

    const currentTitle = currentConversation.title
    if (currentTitle === defaultTitle && currentId) {
      const messageContent = getActiveEngine()?.messages.value.find((item) => item.role === 'user')?.content
      const contentStr = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent)
      updateTitle(currentId, contentStr.substring(0, 20))
    }
  }

  return {
    // 消息管理器
    messageManager,
    // 会话状态
    conversationState,
    // 会话方法（包装后，覆盖原始方法）
    ...apis,
    autoSetTitle
  }
}
