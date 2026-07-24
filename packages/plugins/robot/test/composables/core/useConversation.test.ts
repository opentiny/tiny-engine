import { beforeEach, describe, expect, it, vi } from 'vitest'
import { markRaw, ref } from 'vue'

type MockConversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  metadata?: Record<string, any>
  engine?: {
    messages: ReturnType<typeof ref<any[]>>
    sendMessage: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

const storageSaveConversation = vi.fn()
const deleteConversation = vi.fn()
const clear = vi.fn()
const updateConversationTitle = vi.fn((conversationId: string, title?: string) => {
  const conversation = conversations.value.find((item) => item.id === conversationId)
  if (conversation) {
    conversation.title = title || conversation.title
  }
})
const saveMessages = vi.fn()
const abortActiveRequest = vi.fn()
const switchConversationKit = vi.fn()
const createConversationKit = vi.fn()

const activeConversationId = ref<string | null>('conv-1')
const conversations = ref<MockConversation[]>([])
const activeConversation = ref<MockConversation | null>(null)

let lastUseConversationOptions: any = null

const syncActiveConversation = () => {
  activeConversation.value = conversations.value.find((item) => item.id === activeConversationId.value) || null
}

const updateCurrentEngine = (engine?: MockConversation['engine']) => {
  const index = conversations.value.findIndex((item) => item.id === activeConversationId.value)
  if (index !== -1) {
    conversations.value[index] = {
      ...conversations.value[index],
      engine
    }
  }
  syncActiveConversation()
}

const createEngine = (messages: any[] = []) => ({
  messages: ref(messages),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined)
})

const createRawEngine = (
  messages: any[] = [],
  overrides: Partial<MockConversation['engine']> = {}
): MockConversation['engine'] =>
  markRaw({
    ...createEngine(messages),
    ...overrides
  }) as MockConversation['engine']

const createConversationRecord = (
  overrides: Partial<MockConversation> = {},
  messageOverrides: any[] = []
): MockConversation => ({
  id: overrides.id || 'conv-1',
  title: overrides.title || '新会话',
  createdAt: overrides.createdAt || 100,
  updatedAt: overrides.updatedAt || 100,
  metadata: overrides.metadata || {},
  engine: overrides.engine || createRawEngine(messageOverrides),
  ...overrides
})

vi.mock('@opentiny/tiny-robot-kit', () => ({
  localStorageStrategyFactory: () => ({
    saveConversation: storageSaveConversation
  }),
  useConversation: (options: any) => {
    lastUseConversationOptions = options
    return {
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
    }
  }
}))

describe('useConversationAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    lastUseConversationOptions = null
    activeConversationId.value = 'conv-1'
    conversations.value = [
      createConversationRecord(
        {
          id: 'conv-1',
          title: '新会话',
          metadata: { chatMode: 'chat' }
        },
        []
      )
    ]
    syncActiveConversation()

    createConversationKit.mockImplementation(({ title, metadata }: any) => {
      const conversation = createConversationRecord({
        id: `conv-${conversations.value.length + 1}`,
        title,
        metadata: metadata || {},
        createdAt: 100 + conversations.value.length,
        updatedAt: 100 + conversations.value.length
      })
      conversations.value.push(conversation)
      activeConversationId.value = conversation.id
      syncActiveConversation()
      return conversation
    })

    switchConversationKit.mockImplementation(async (conversationId: string) => {
      activeConversationId.value = conversationId
      syncActiveConversation()
      return true
    })
  })

  const createAdapter = async () => {
    const module = await import('../../../src/composables/core/useConversation')

    return module.useConversationAdapter({
      provider: {
        chatStream: vi.fn().mockResolvedValue(undefined)
      } as any,
      onStreamData: vi.fn(),
      onFinishRequest: vi.fn().mockResolvedValue(undefined),
      onMessageProcessed: vi.fn().mockResolvedValue(undefined),
      statusManager: {
        isProcessing: vi.fn(() => false),
        setProcessing: vi.fn(),
        resetProcessing: vi.fn()
      }
    })
  }

  describe('conversation state and save helpers', () => {
    it('exposes current conversation id and conversation list', async () => {
      const adapter = await createAdapter()

      expect(adapter.conversationState.currentId).toBe('conv-1')
      expect(adapter.conversationState.conversations).toHaveLength(1)
      expect(adapter.conversationState.conversations[0].id).toBe('conv-1')
    })

    it('saves all conversations through the storage strategy', async () => {
      conversations.value.push(
        createConversationRecord({
          id: 'conv-2',
          title: '第二个会话',
          metadata: { chatMode: 'agent' }
        })
      )
      const adapter = await createAdapter()

      adapter.saveConversations()

      expect(storageSaveConversation).toHaveBeenCalledTimes(2)
      expect(storageSaveConversation).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'conv-1',
          title: '新会话',
          metadata: { chatMode: 'chat' }
        })
      )
      expect(storageSaveConversation).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'conv-2',
          title: '第二个会话',
          metadata: { chatMode: 'agent' }
        })
      )
    })

    it('does nothing when updateMetadata targets a missing conversation', async () => {
      const adapter = await createAdapter()

      adapter.updateMetadata('missing', { chatMode: 'agent' })

      expect(storageSaveConversation).not.toHaveBeenCalled()
      expect(adapter.conversationState.conversations[0].metadata).toEqual({ chatMode: 'chat' })
    })

    it('merges metadata and persists the active conversation', async () => {
      const adapter = await createAdapter()

      adapter.updateMetadata('conv-1', { chatMode: 'agent', feature: 'vision' })

      expect(adapter.conversationState.conversations[0].metadata).toEqual({
        chatMode: 'agent',
        feature: 'vision'
      })
      expect(storageSaveConversation).toHaveBeenCalledTimes(1)
      expect(storageSaveConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'conv-1',
          metadata: {
            chatMode: 'agent',
            feature: 'vision'
          }
        })
      )
    })

    it('updates the current metadata cache so future assistant chunks inherit the latest mode', async () => {
      const onStreamData = vi.fn()
      const onFinishRequest = vi.fn().mockResolvedValue(undefined)
      const onMessageProcessed = vi.fn().mockResolvedValue(undefined)
      const statusManager = {
        isProcessing: vi.fn(() => false),
        setProcessing: vi.fn(),
        resetProcessing: vi.fn()
      }
      const module = await import('../../../src/composables/core/useConversation')
      const adapter = module.useConversationAdapter({
        provider: {
          chatStream: vi.fn().mockResolvedValue(undefined)
        } as any,
        onStreamData,
        onFinishRequest,
        onMessageProcessed,
        statusManager
      })

      adapter.updateMetadata('conv-1', { chatMode: 'agent' })

      const currentMessage = {
        role: '',
        renderContent: [],
        metadata: {}
      }
      const chunk = {
        created: 123,
        id: 'cmpl-1',
        model: 'model-a'
      }
      const choice = {
        delta: {
          role: 'assistant'
        }
      }

      lastUseConversationOptions.useMessageOptions.onCompletionChunk(
        {
          currentMessage,
          messages: [currentMessage],
          chunk,
          choice
        },
        () => {}
      )

      expect(currentMessage.metadata.chatMode).toBe('agent')
      expect(currentMessage.metadata.createdAt).toBe(123)
      expect(currentMessage.metadata.id).toBe('cmpl-1')
      expect(currentMessage.metadata.model).toBe('model-a')
      expect(onStreamData).toHaveBeenCalledTimes(1)
    })
  })

  describe('message manager', () => {
    it('exposes messages from the active engine', async () => {
      updateCurrentEngine(createRawEngine([{ role: 'user', content: 'hello' }]))
      const adapter = await createAdapter()

      expect(adapter.messageManager.messages.value).toEqual([{ role: 'user', content: 'hello' }])
    })

    it('delegates sendMessage to the active engine', async () => {
      const sendMessage = vi.fn().mockResolvedValue('sent')
      updateCurrentEngine(
        createRawEngine([], {
          messages: ref([]),
          sendMessage,
          send: vi.fn().mockResolvedValue(undefined)
        })
      )
      const adapter = await createAdapter()

      await adapter.messageManager.sendMessage('hello world')

      expect(sendMessage).toHaveBeenCalledWith('hello world')
    })

    it('delegates send to the active engine', async () => {
      const send = vi.fn().mockResolvedValue('sent')
      updateCurrentEngine(
        createRawEngine([], {
          messages: ref([]),
          sendMessage: vi.fn().mockResolvedValue(undefined),
          send
        })
      )
      const adapter = await createAdapter()
      const message = { role: 'user', content: 'hello' }

      await adapter.messageManager.send(message as any)

      expect(send).toHaveBeenCalledWith(message)
    })

    it('falls back to resolved promises when there is no active engine', async () => {
      updateCurrentEngine(undefined)
      const adapter = await createAdapter()

      await expect(adapter.messageManager.sendMessage('hello')).resolves.toBeUndefined()
      await expect(adapter.messageManager.send({ role: 'user', content: 'msg' } as any)).resolves.toBeUndefined()
    })

    it('delegates abortRequest to the underlying conversation hook', async () => {
      const adapter = await createAdapter()

      adapter.messageManager.abortRequest()

      expect(abortActiveRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('createConversation', () => {
    it('reuses the current empty conversation instead of creating a new one', async () => {
      const adapter = await createAdapter()

      const result = adapter.createConversation('重命名会话', { chatMode: 'agent' })

      expect(result).toBe('conv-1')
      expect(createConversationKit).not.toHaveBeenCalled()
      expect(adapter.conversationState.conversations[0].title).toBe('重命名会话')
      expect(adapter.conversationState.conversations[0].metadata).toEqual({ chatMode: 'agent' })
      expect(storageSaveConversation).toHaveBeenCalledTimes(1)
    })

    it('creates a brand new conversation when the current one already contains user content', async () => {
      updateCurrentEngine(createRawEngine([{ role: 'user', content: '已有消息' }]))
      const adapter = await createAdapter()

      const result = adapter.createConversation('新的会话', { chatMode: 'agent' })

      expect(result).toBe('conv-2')
      expect(createConversationKit).toHaveBeenCalledWith({
        title: '新的会话',
        metadata: { chatMode: 'agent' }
      })
      expect(adapter.conversationState.currentId).toBe('conv-2')
      expect(adapter.conversationState.conversations).toHaveLength(2)
    })

    it('treats tool calls as non-empty conversation content', async () => {
      updateCurrentEngine(createRawEngine([{ role: 'assistant', content: '', tool_calls: [{ id: 'call-1' }] }]))
      const adapter = await createAdapter()

      adapter.createConversation('工具会话', { chatMode: 'chat' })

      expect(createConversationKit).toHaveBeenCalledTimes(1)
    })

    it('treats tool_call_id as non-empty conversation content', async () => {
      updateCurrentEngine(createRawEngine([{ role: 'tool', content: '', tool_call_id: 'call-1' }]))
      const adapter = await createAdapter()

      adapter.createConversation('工具结果会话', { chatMode: 'chat' })

      expect(createConversationKit).toHaveBeenCalledTimes(1)
    })

    it('treats renderContent-only messages as non-empty conversation content', async () => {
      updateCurrentEngine(createRawEngine([{ role: 'user', content: '', renderContent: [{ type: 'text' }] }]))
      const adapter = await createAdapter()

      adapter.createConversation('渲染内容会话', { chatMode: 'chat' })

      expect(createConversationKit).toHaveBeenCalledTimes(1)
    })

    it('keeps existing metadata when reusing an empty conversation without new metadata', async () => {
      conversations.value[0].metadata = { chatMode: 'chat', tag: 'old' }
      const adapter = await createAdapter()

      adapter.createConversation('空会话改名')

      expect(adapter.conversationState.conversations[0].metadata).toEqual({ chatMode: 'chat', tag: 'old' })
      expect(storageSaveConversation).toHaveBeenCalledTimes(1)
    })
  })

  describe('switchConversation', () => {
    it('returns null when the target conversation does not exist', async () => {
      const adapter = await createAdapter()

      const result = await adapter.switchConversation('missing')

      expect(result).toBeNull()
      expect(switchConversationKit).not.toHaveBeenCalled()
    })

    it('delegates to the underlying switch function and calls onStart with wrapped apis', async () => {
      conversations.value.push(
        createConversationRecord({
          id: 'conv-2',
          title: '第二个会话',
          metadata: { chatMode: 'agent' }
        })
      )
      const adapter = await createAdapter()
      const onStart = vi.fn()

      const result = await adapter.switchConversation('conv-2', onStart)

      expect(result).toBe(true)
      expect(switchConversationKit).toHaveBeenCalledWith('conv-2')
      expect(onStart).toHaveBeenCalledTimes(1)
      const [state, messages, methods] = onStart.mock.calls[0]
      expect(state.currentId).toBe('conv-2')
      expect(messages).toEqual([])
      expect(methods.createConversation).toBeTypeOf('function')
      expect(methods.switchConversation).toBeTypeOf('function')
      expect(methods.updateMetadata).toBeTypeOf('function')
    })

    it('does not call onStart when the underlying switch returns a falsy result', async () => {
      conversations.value.push(
        createConversationRecord({
          id: 'conv-2',
          title: '第二个会话',
          metadata: { chatMode: 'agent' }
        })
      )
      switchConversationKit.mockResolvedValueOnce(false)
      const adapter = await createAdapter()
      const onStart = vi.fn()

      const result = await adapter.switchConversation('conv-2', onStart)

      expect(result).toBe(false)
      expect(onStart).not.toHaveBeenCalled()
    })
  })

  describe('autoSetTitle', () => {
    it('updates the default title using the first user text message', async () => {
      updateCurrentEngine(
        createRawEngine([
          { role: 'system', content: 'system prompt' },
          { role: 'user', content: '请帮我生成一个表单页面' },
          { role: 'assistant', content: '好的' }
        ])
      )
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).toHaveBeenCalledWith('conv-1', '请帮我生成一个表单页面')
    })

    it('extracts title text from multimodal user content arrays', async () => {
      updateCurrentEngine(
        createRawEngine([
          {
            role: 'user',
            content: [
              { type: 'text', text: '对比这两张图片的布局差异并总结' },
              { type: 'image_url', image_url: { url: 'https://example.com/1.png' } },
              { type: 'image_url', image_url: { url: 'https://example.com/2.png' } }
            ]
          }
        ])
      )
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).toHaveBeenCalledWith('conv-1', '对比这两张图片的布局差异并总结')
    })

    it('joins multiple text fragments from multimodal content before truncation', async () => {
      updateCurrentEngine(
        createRawEngine([
          {
            role: 'user',
            content: [
              { type: 'text', text: '第一段需求' },
              { type: 'image_url', image_url: { url: 'https://example.com/1.png' } },
              { type: 'text', text: '第二段补充说明' }
            ]
          }
        ])
      )
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).toHaveBeenCalledWith('conv-1', '第一段需求\n第二段补充说明')
    })

    it('falls back to JSON when multimodal content does not contain any text part', async () => {
      const imageOnlyMessage = [
        { type: 'image_url', image_url: { url: 'https://example.com/1.png' } },
        { type: 'image_url', image_url: { url: 'https://example.com/2.png' } }
      ]
      updateCurrentEngine(
        createRawEngine([
          {
            role: 'user',
            content: imageOnlyMessage
          }
        ])
      )
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).toHaveBeenCalledWith('conv-1', JSON.stringify(imageOnlyMessage).substring(0, 20))
    })

    it('truncates long titles to 20 characters', async () => {
      updateCurrentEngine(
        createRawEngine([
          {
            role: 'user',
            content: '这是一个非常长非常长非常长非常长的标题文本，用于测试截断逻辑'
          }
        ])
      )
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).toHaveBeenCalledWith(
        'conv-1',
        '这是一个非常长非常长非常长非常长的标题文本'.substring(0, 20)
      )
    })

    it('uses the first user message instead of later user messages', async () => {
      updateCurrentEngine(
        createRawEngine([
          {
            role: 'user',
            content: '第一次提问标题'
          },
          {
            role: 'assistant',
            content: '回答'
          },
          {
            role: 'user',
            content: '第二次提问标题'
          }
        ])
      )
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).toHaveBeenCalledWith('conv-1', '第一次提问标题')
    })

    it('does not update title when the conversation title has already been customized', async () => {
      conversations.value[0].title = '用户手动标题'
      updateCurrentEngine(createRawEngine([{ role: 'user', content: '不会被使用' }]))
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-1')

      expect(updateConversationTitle).not.toHaveBeenCalled()
    })

    it('does not update title for inactive conversations', async () => {
      conversations.value.push(
        createConversationRecord({
          id: 'conv-2',
          title: '新会话',
          metadata: { chatMode: 'agent' }
        })
      )
      conversations.value[1] = {
        ...conversations.value[1],
        engine: createRawEngine([{ role: 'user', content: 'inactive conversation title' }])
      }
      syncActiveConversation()
      const adapter = await createAdapter()

      adapter.autoSetTitle('conv-2')

      expect(updateConversationTitle).not.toHaveBeenCalled()
    })

    it('does not update title when the conversation cannot be found', async () => {
      const adapter = await createAdapter()

      adapter.autoSetTitle('missing')

      expect(updateConversationTitle).not.toHaveBeenCalled()
    })
  })

  describe('adapter plugin behavior', () => {
    it('marks message state as error when the useMessage plugin reports an error', async () => {
      const adapter = await createAdapter()
      const error = new Error('stream failed')

      lastUseConversationOptions.useMessageOptions.plugins[0].onError({ error })

      expect(adapter.messageManager.messageState.status).toBe('error')
      expect(adapter.messageManager.messageState.errorMsg).toBe(error)
    })

    it('calls onFinishRequest after the adapter plugin observes a finished response', async () => {
      const onFinishRequest = vi.fn().mockResolvedValue(undefined)
      const statusManager = {
        isProcessing: vi.fn(() => false),
        setProcessing: vi.fn(),
        resetProcessing: vi.fn()
      }
      const module = await import('../../../src/composables/core/useConversation')
      module.useConversationAdapter({
        provider: {
          chatStream: vi.fn().mockResolvedValue(undefined)
        } as any,
        onStreamData: vi.fn(),
        onFinishRequest,
        onMessageProcessed: vi.fn().mockResolvedValue(undefined),
        statusManager
      })
      const messages = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'world' }
      ]

      await lastUseConversationOptions.useMessageOptions.plugins[0].onAfterRequest({
        messages,
        lastChoice: {
          finish_reason: 'stop'
        }
      })

      expect(statusManager.setProcessing).toHaveBeenCalledTimes(1)
      expect(onFinishRequest).toHaveBeenCalledWith('stop', messages, [messages[0]], expect.any(Object))
    })

    it('skips onFinishRequest when the status manager is already processing', async () => {
      const onFinishRequest = vi.fn().mockResolvedValue(undefined)
      const statusManager = {
        isProcessing: vi.fn(() => true),
        setProcessing: vi.fn(),
        resetProcessing: vi.fn()
      }
      const module = await import('../../../src/composables/core/useConversation')
      module.useConversationAdapter({
        provider: {
          chatStream: vi.fn().mockResolvedValue(undefined)
        } as any,
        onStreamData: vi.fn(),
        onFinishRequest,
        onMessageProcessed: vi.fn().mockResolvedValue(undefined),
        statusManager
      })

      await lastUseConversationOptions.useMessageOptions.plugins[0].onAfterRequest({
        messages: [{ role: 'user', content: 'hello' }],
        lastChoice: {
          finish_reason: 'stop'
        }
      })

      expect(statusManager.setProcessing).not.toHaveBeenCalled()
      expect(onFinishRequest).not.toHaveBeenCalled()
    })
  })
})
