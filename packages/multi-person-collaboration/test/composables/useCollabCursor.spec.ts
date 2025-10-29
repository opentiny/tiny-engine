import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, effectScope, nextTick } from 'vue'
import { useCollabCursor } from '../../src/composables/useCollabCursor'

const mockAwareness = {
  clientID: 1,
  getStates: () => new Map(),
  getLocalState: vi.fn().mockReturnValue({}),
  setLocalStateField: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

vi.mock('../../src/composables/useYjs', () => ({
  useYjs: () => ({ awareness: ref(mockAwareness) })
}))

vi.mock('../../src/config', () => ({ PORT: 1234 }))

describe('useCollabCursor', () => {
  const currentUser = { id: 1, name: 'Alice', color: '#f00' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function runComposable() {
    const scope = effectScope()
    let result: ReturnType<typeof useCollabCursor>
    scope.run(() => {
      result = useCollabCursor({ roomId: 'room1', currentUser })
    })
    // @ts-expect-error result 是 scope.run 里赋值的
    return { ...result, stop: () => scope.stop() }
  }

  it('初始化时应设置 cursor 为 (-1, -1, false)', async () => {
    runComposable()
    await nextTick()
    expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('cursor', {
      x: -1,
      y: -1,
      pressed: false
    })
  })

  it('updateCursorPositioin 应更新光标位置', () => {
    const { updateCursorPositioin } = runComposable()

    // 模拟事件对象
    const fakeEvent = {
      pageX: 100,
      pageY: 200,
      buttons: 1
    } as unknown as MouseEvent

    updateCursorPositioin(fakeEvent)

    expect(mockAwareness.setLocalStateField).toHaveBeenCalledWith('cursor', {
      x: 100,
      y: 200,
      pressed: true
    })
  })

  it('mouseDownHandler / mouseUpHandler 应切换 pressed 状态', () => {
    const { mouseDownHandler, mouseUpHandler } = runComposable()

    mouseDownHandler()
    expect(mockAwareness.setLocalStateField).toHaveBeenLastCalledWith(
      'cursor',
      expect.objectContaining({ pressed: true })
    )

    mouseUpHandler()
    expect(mockAwareness.setLocalStateField).toHaveBeenLastCalledWith(
      'cursor',
      expect.objectContaining({ pressed: false })
    )
  })
})
