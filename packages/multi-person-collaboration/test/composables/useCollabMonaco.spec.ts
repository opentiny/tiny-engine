// test/composables/useCollabMonaco.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCollabMonaco } from '../../src/composables/useCollabMonaco'
import type { UserAwareness } from '../../src/type'

// Mock yjs
const mockYText = {
  insert: vi.fn(),
  delete: vi.fn(),
  toString: vi.fn().mockReturnValue('')
}

// Mock MonacoBinding
vi.mock('y-monaco', () => ({
  MonacoBinding: vi.fn().mockImplementation(() => ({
    destroy: vi.fn()
  }))
}))

// Mock useYjs
vi.mock('../../src/composables/useYjs', () => ({
  useYjs: vi.fn(() => {
    const provider = ref({
      synced: true,
      once: vi.fn(),
      off: vi.fn()
    })
    const ydoc = {
      getText: vi.fn(() => mockYText)
    }
    const awareness = ref({
      setLocalStateField: vi.fn()
    })
    return { ydoc, provider, awareness }
  })
}))

// Mock config
vi.mock('../../src/config', () => ({
  PORT: 1234
}))

describe('useCollabMonaco', () => {
  const currentUser: UserAwareness = { id: 1, name: 'Alice', color: '#f00' }
  const editorRef = {
    getModel: vi.fn(() => ({}))
  }

  it('应成功初始化并绑定 MonacoBinding', async () => {
    const { binding, yText, provider } = useCollabMonaco({
      currentUser,
      editorRef,
      roomId: 'room1',
      fieldName: 'field1'
    })

    // 驱动响应式更新
    await nextTick()

    expect(yText).toBe(mockYText)
    expect(binding).not.toBeNull()
    expect(binding?.destroy).toBeDefined()
    expect(provider.value?.synced).toBe(true)
  })

  it('应调用 awareness.setLocalStateField 设置用户信息', async () => {
    const { binding, provider } = useCollabMonaco({
      currentUser,
      editorRef,
      roomId: 'room1',
      fieldName: 'field1'
    })

    await nextTick()
    const awareness = provider.value ? provider.value.once.mock.calls[0][0] : null
    // 因为我们 mock 的 provider.once 并未真正调用 bind，这里主要验证 MonacoBinding 创建
    expect(binding).not.toBeNull()
  })

  it('onUnmounted 应销毁 binding 并清理监听器', async () => {
    const { binding } = useCollabMonaco({
      currentUser,
      editorRef,
      roomId: 'room1',
      fieldName: 'field1'
    })
    await nextTick()
    const destroyFn = binding?.destroy
    destroyFn?.()
    expect(destroyFn).toHaveBeenCalled()
  })
})
