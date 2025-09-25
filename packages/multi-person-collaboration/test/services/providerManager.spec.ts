import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Y from 'yjs'
import { ProviderManager } from '../../src/services/providerManager'
import { WebsocketProvider } from 'y-websocket'

// Mock WebsocketProvider
vi.mock('y-websocket', () => {
  return {
    WebsocketProvider: vi.fn().mockImplementation((_url, _roomId, _ydoc) => {
      return {
        destroy: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      }
    })
  }
})

describe('ProviderManager 单元测试', () => {
  let manager: ProviderManager
  let ydoc: Y.Doc

  beforeEach(() => {
    // 重置单例
    // @ts-ignore
    ProviderManager.instance = undefined
    manager = ProviderManager.getInstance()
    ydoc = new Y.Doc()
  })

  it('应该返回同一个单例实例', () => {
    const instance2 = ProviderManager.getInstance()
    expect(instance2).toBe(manager)
  })

  it('应该创建 WebsocketProvider 并缓存', () => {
    const provider = manager.createProvider('room1', ydoc, { websocketUrl: 'ws://localhost:1234' })
    expect(provider).toBeDefined()
    expect(WebsocketProvider).toHaveBeenCalledWith('ws://localhost:1234', 'room1', ydoc)

    // 再次创建同名 room 默认返回缓存
    const provider2 = manager.createProvider('room1', ydoc, { websocketUrl: 'ws://localhost:1234' })
    expect(provider2).toBe(provider)
  })

  it('forceNew 为 true 时应该重新创建', () => {
    const oldProvider = manager.createProvider('room2', ydoc, { websocketUrl: 'ws://localhost:1234' })
    const newProvider = manager.createProvider('room2', ydoc, { websocketUrl: 'ws://localhost:1234' }, true)
    expect(newProvider).not.toBe(oldProvider)
  })

  it('应该获取指定的 Provider', () => {
    const provider = manager.createProvider('room3', ydoc, { websocketUrl: 'ws://localhost:1234' })
    expect(manager.getProvider('room3')).toBe(provider)
    expect(manager.getProvider('不存在的room')).toBeUndefined()
  })

  it('应该销毁指定的 Provider', () => {
    const provider = manager.createProvider('room4', ydoc, { websocketUrl: 'ws://localhost:1234' })
    const destroySpy = vi.spyOn(provider, 'destroy')
    manager.destroyProvider('room4')
    expect(destroySpy).toHaveBeenCalled()
    expect(manager.getProvider('room4')).toBeUndefined()
  })

  it('应该销毁所有 Provider', () => {
    const p1 = manager.createProvider('A', ydoc, { websocketUrl: 'ws://localhost:1234' })
    const p2 = manager.createProvider('B', ydoc, { websocketUrl: 'ws://localhost:1234' })
    const spy1 = vi.spyOn(p1, 'destroy')
    const spy2 = vi.spyOn(p2, 'destroy')

    manager.destroyAllProviders()
    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
    expect(manager.getProvider('A')).toBeUndefined()
    expect(manager.getProvider('B')).toBeUndefined()
  })

  it('应该绑定 status 事件并返回解绑函数', () => {
    const provider: any = manager.createProvider('roomStatus', ydoc, { websocketUrl: 'ws://localhost:1234' })
    const callback = vi.fn()

    const off = manager.onStatus('roomStatus', callback)
    expect(provider.on).toHaveBeenCalledWith('status', callback)

    off()
    expect(provider.off).toHaveBeenCalledWith('status', callback)
  })

  it('未提供有效选项时应该抛出错误', () => {
    expect(() => manager.createProvider('roomX', ydoc, {} as any)).toThrowError(
      'ProviderManager: No valid provider options provided.'
    )
  })
})
