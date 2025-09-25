import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AwarenessStateModel } from '../../src/models/AwarenessStateModel'
import type { Awareness } from 'y-protocols/awareness.js'

interface MockUserAwareness {
  id: number
  name: string
}

// 模拟 Yjs Awareness
class MockAwareness {
  public clientID = 1
  private states: Map<number, any> = new Map()
  private listeners: Map<string, Function[]> = new Map()

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const arr = this.listeners.get(event)
    if (arr)
      this.listeners.set(
        event,
        arr.filter((fn) => fn !== callback)
      )
  }

  getStates() {
    return this.states
  }

  setLocalStateField(field: string, value: any) {
    const localState = this.states.get(this.clientID) || {}
    localState[field] = value
    this.states.set(this.clientID, localState)
    // 模拟 update 事件
    this.trigger('update', { added: [], updated: [this.clientID], removed: [] })
  }

  trigger(event: string, payload: any) {
    const arr = this.listeners.get(event)
    if (arr) arr.forEach((fn) => fn(payload))
  }

  addState(clientId: number, state: any) {
    this.states.set(clientId, state)
    this.trigger('update', { added: [clientId], updated: [], removed: [] })
  }

  updateState(clientId: number, state: any) {
    this.states.set(clientId, state)
    this.trigger('update', { added: [], updated: [clientId], removed: [] })
  }

  removeState(clientId: number) {
    this.states.delete(clientId)
    this.trigger('update', { added: [], updated: [], removed: [clientId] })
  }
}

describe('AwarenessStateModel', () => {
  let awareness: MockAwareness
  let model: AwarenessStateModel<{ user: MockUserAwareness }>

  beforeEach(() => {
    awareness = new MockAwareness()
    model = new AwarenessStateModel<{ user: MockUserAwareness }>(awareness as unknown as Awareness)
  })

  it('updateLocalStateField 应该更新本地状态', () => {
    model.updateLocalStateField('user', { id: 1, name: 'Alice' })
    expect(awareness.getStates().get(1)).toEqual({ user: { id: 1, name: 'Alice' } })
  })

  it('enter 事件应该在新客户端加入时触发', () => {
    const callback = vi.fn()
    model.emitter.on('enter', callback)

    const newClientId = 2
    const newState = { user: { id: 2, name: 'Bob' } }
    awareness.addState(newClientId, newState)

    expect(callback).toHaveBeenCalledWith({ clientId: newClientId, state: newState })
  })

  it('change 事件应该在其他客户端状态变化时触发', () => {
    const callback = vi.fn()
    model.emitter.on('change', callback)

    // 添加一个新客户端
    awareness.addState(2, { user: { id: 2, name: 'Bob' } })
    // 更新该客户端状态
    const newState = { user: { id: 2, name: 'Bob2' } }
    awareness.updateState(2, newState)

    expect(callback).toHaveBeenCalledWith({ clientId: 2, state: newState })
  })

  it('change 事件不应在本客户端自己更新时触发', () => {
    const callback = vi.fn()
    model.emitter.on('change', callback)

    model.updateLocalStateField('user', { id: 1, name: 'Alice' })
    expect(callback).not.toHaveBeenCalled()
  })

  it('leave 事件应该在客户端离开时触发', () => {
    const callback = vi.fn()
    model.emitter.on('leave', callback)

    awareness.addState(2, { user: { id: 2, name: 'Bob' } })
    awareness.removeState(2)

    expect(callback).toHaveBeenCalledWith({ clientId: 2 })
  })

  it('destroy 应该解绑 awareness 并清空 emitter', () => {
    const spyOff = vi.spyOn(awareness, 'off')
    model.destroy()
    expect(spyOff).toHaveBeenCalled()
    expect(model.emitter.all.size).toBe(0)
  })
})
