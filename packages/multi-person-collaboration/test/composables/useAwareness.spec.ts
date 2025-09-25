import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useAwareness } from '../../src/composables/useAwareness'
import type { Awareness } from 'y-protocols/awareness.js'

// 创建一个 Fake Awareness
class FakeAwareness {
  clientID = 1
  states = new Map()
  listeners: Record<string, Function[]> = {}

  getStates() {
    return this.states
  }

  setLocalStateField(field: string, value: any) {
    const state = this.states.get(this.clientID) || {}
    state[field] = value
    this.states.set(this.clientID, state)
  }

  on(event: string, cb: Function) {
    this.listeners[event] = this.listeners[event] || []
    this.listeners[event].push(cb)
  }

  off(event: string, cb: Function) {
    this.listeners[event] = (this.listeners[event] || []).filter((fn) => fn !== cb)
  }

  emit(event: string, payload: any) {
    this.listeners[event]?.forEach((fn) => fn(payload))
  }
}

describe('useAwareness composable', () => {
  let awareness: FakeAwareness
  let awarenessRef: ReturnType<typeof ref>

  const currentUser = { id: 'u1', name: 'Alice' }

  beforeEach(() => {
    awareness = new FakeAwareness()
    awarenessRef = ref(awareness as unknown as Awareness)
  })

  it('should init and set local user state', async () => {
    const { remoteStates } = useAwareness(awarenessRef, currentUser)
    await nextTick()

    // AwarenessStateModel 初始化时应该设置 local state
    const localState = awareness.getStates().get(1)
    expect(localState.user).toEqual(currentUser)

    // 模拟远端用户加入
    awareness.states.set(2, { user: { id: 'u2', name: 'Bob' } })
    awareness.emit('update', { added: [2], updated: [], removed: [] })
    await nextTick()

    expect(remoteStates[2]).toEqual({ user: { id: 'u2', name: 'Bob' } })
  })

  it('should handle change event', async () => {
    const { remoteStates } = useAwareness(awarenessRef, currentUser)
    await nextTick()

    awareness.states.set(2, { user: { id: 'u2', name: 'Bob' } })
    awareness.emit('update', { added: [], updated: [2], removed: [] })
    await nextTick()

    expect(remoteStates[2]).toEqual({ user: { id: 'u2', name: 'Bob' } })
  })

  it('should handle leave event', async () => {
    const { remoteStates } = useAwareness(awarenessRef, currentUser)
    await nextTick()

    remoteStates[2] = { user: { id: 'u2', name: 'Bob' } }
    awareness.emit('update', { added: [], updated: [], removed: [2] })
    await nextTick()

    expect(remoteStates[2]).toBeUndefined()
  })

  it('should call updateLocalStateField', async () => {
    const { updateLocalStateField } = useAwareness(awarenessRef, currentUser)
    await nextTick()

    updateLocalStateField('user', { id: 'u1', name: 'Alice-updated' })

    const localState = awareness.getStates().get(1)
    expect(localState.user).toEqual({ id: 'u1', name: 'Alice-updated' })
  })
})
