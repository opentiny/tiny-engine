import { toRaw } from 'vue'
import { useConversation as useConversationKit, type UseMessageOptions } from '@opentiny/tiny-robot-kit'
import type { AIClient } from '@opentiny/tiny-robot-kit'

export interface ConversationAdapterOptions {
  client: AIClient
  // 业务回调函数
  onStreamData: (data: any, messages: any[]) => void
  onFinishRequest: (finishReason: string, messages: any[], contextMessages: any[], messageState: any) => Promise<void>
  onMessageProcessed: (finishReason: string, content: any, messages: any[], context: any) => Promise<void>
  statusManager: {
    isProcessing: () => boolean
    setProcessing: () => void
  }
}

export interface ConversationMetadata {
  chatMode?: string
  [key: string]: any
}

/**
 * Conversation 适配器
 * 将 tiny-robot-kit 的 useConversation 与业务逻辑解耦
 */
export function useConversationAdapter(options: ConversationAdapterOptions) {
  const { client, onStreamData, onFinishRequest, onMessageProcessed, statusManager } = options

  // 构建 events 适配器，连接业务回调
  const events: UseMessageOptions['events'] = {
    onReceiveData: (data, messages, preventDefault) => {
      preventDefault()
      onStreamData(data, messages.value)
    },
    async onFinish(finishReason, { messages, messageState }, preventDefault) {
      preventDefault()
      if (statusManager.isProcessing()) {
        // 无效场景，直接返回，例如返回流中出现了多次 [Done], 只响应第一次
        return
      } else {
        statusManager.setProcessing()
      }
      const contextMessages = toRaw(messages.value.slice(0, -1))
      await onFinishRequest(finishReason ?? 'unknown', messages.value, contextMessages, messageState)
      const lastMessage = messages.value.at(-1)
      if (lastMessage) {
        await onMessageProcessed(finishReason ?? 'unknown', lastMessage.content ?? '', messages.value, {})
      }
    }
  }

  // 使用 tiny-robot-kit 的 useConversation
  const {
    messageManager,
    state: conversationState,
    ...conversationMethods
  } = useConversationKit({
    client,
    events
  })

  /**
   * 创建新会话
   * @param title 会话标题
   * @param metadata 会话元数据（如 chatMode）
   */
  const createConversation = (title: string, metadata?: ConversationMetadata) => {
    return conversationMethods.createConversation(title, metadata)
  }

  /**
   * 切换会话
   * @param conversationId 会话ID
   * @param onStart 切换成功后的回调
   */
  const switchConversation = (conversationId: string, onStart?: (state: any, messages: any, methods: any) => void) => {
    const conversation = conversationState.conversations.find((c) => c.id === conversationId)
    if (!conversation) return

    const result = conversationMethods.switchConversation(conversationId)

    // 触发业务回调
    if (onStart) {
      onStart(conversationState, messageManager.messages.value, conversationMethods)
    }

    return result
  }

  /**
   * 自动设置会话标题
   * @param currentId 当前会话ID
   * @param defaultTitle 默认标题
   */
  const autoSetTitle = (currentId: string, defaultTitle = '新会话') => {
    const currentConversation = conversationState.conversations.find((conversation) => conversation.id === currentId)
    if (!currentConversation) return

    const currentTitle = currentConversation?.title
    if (currentTitle === defaultTitle && currentId) {
      const messageContent = currentConversation.messages.find((item) => item.role === 'user')?.content
      const contentStr = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent)
      conversationMethods.updateTitle(currentId, contentStr.substring(0, 20))
    }
  }

  return {
    // 消息管理器
    messageManager,
    // 会话状态
    conversationState,
    // 会话方法（包装后，覆盖原始方法）
    ...conversationMethods,
    createConversation,
    switchConversation,
    autoSetTitle
  }
}
