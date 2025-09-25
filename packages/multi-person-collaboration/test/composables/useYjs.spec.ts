import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useYjs } from '../../src/composables/useYjs'
import { DocManager } from '../../src/services/docManager'
import { ProviderManager } from '../../src/services/providerManager'
import * as Y from 'yjs'

vi.mock('../../src/services/docManager', () => {
  return {
    DocManager: {
      getInstance: vi.fn(() => ({
        getOrCreateDoc: vi.fn(() => ({ id: 'mock-doc' }))
      }))
    }
  }
})

// ===== Mock ProviderManager =====
vi.mock('../../src/services/providerManager', () => {
  return {
    ProviderManager: {
      getInstance: vi.fn(() => ({
        createProvider: vi.fn(() => {
          return {
            awareness: { setLocalState: vi.fn() },
            on: vi.fn()
          }
        }),
        destroyProvider: vi.fn()
      }))
    }
  }
})

describe('useYjs composable', () => {
  let useYjs: any

  beforeEach(async () => {
    // ✅ 动态 import，保证 mock 已经生效
    const mod = await import('../../src/composables/useYjs')
    useYjs = mod.useYjs
  })

  it('should init in online mode with provider', () => {
    const { ydoc, provider, awareness, status } = useYjs('room-1', {
      websocketUrl: 'ws://localhost:1234'
    })

    expect(ydoc).toEqual({ id: 'mock-doc' })
    expect(provider.value).not.toBeNull()
    expect(awareness.value).not.toBeNull()
    // 初始状态 disconnected
    expect(status.value).toBe('disconnected')
  })

  it('should init in offline mode without provider', () => {
    const { provider, awareness, status } = useYjs('room-2')

    expect(provider.value).toBeNull()
    expect(awareness.value).toBeNull()
    // 离线模式下直接视为 connected
    expect(status.value).toBe('connected')
  })
})
