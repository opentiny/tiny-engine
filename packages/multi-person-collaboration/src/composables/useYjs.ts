import { onUnmounted, readonly, ref, shallowRef, type Ref } from 'vue'
import { DocManager } from '../services/docManager'
import { ProviderManager, type YjsProvider } from '../services/providerManager'
import * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness.js'

interface UseYjsOptions {
  websocketUrl?: string // WebSocket 服务器地址
  // indexedDbName?: string; // IndexedDB 数据库名称，用于离线持久化
  // webrtcSignalingUrls?: string[]; // WebRTC 信令服务器地址
}

interface UseYjsReturn {
  ydoc: Y.Doc
  provider: Readonly<Ref<YjsProvider | null>>
  awareness: Readonly<Ref<Awareness | null>>
  status: Readonly<Ref<'connecting' | 'connected' | 'disconnected' | 'error'>>
}

/**
 * useYjs Composable
 * 作为整个协同系统的「总入口」，负责全局初始化和管理 Yjs 相关服务。
 * 提供 Y.Doc、Provider 和 Awareness ( AwarenessStateModel ) 的统一对外 API。
 */
export function useYjs(roomId: string, options?: UseYjsOptions): UseYjsReturn {
  const docManager = DocManager.getInstance()
  const providerManager = ProviderManager.getInstance()

  const ydoc = docManager.getOrCreateDoc(roomId)
  const provider = shallowRef<YjsProvider | null>(null)
  const awareness = shallowRef<Awareness | null>(null)
  const status = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  // 初始化 Provider
  if (options?.websocketUrl) {
    const p = providerManager.createProvider(roomId, ydoc, { websocketUrl: options.websocketUrl })
    provider.value = p

    // 在 provider 创建后，再创建 AwarenessStateModel
    if (p.awareness) {
      awareness.value = p.awareness
    }

    p.on('status', (event: { status: 'connected' | 'disconnected' }) => {
      status.value = event.status
      // eslint-disable-next-line no-console
      console.log(`[${roomId}] useYjs: Provider status for room ${roomId}: ${event.status}`)
    })
    p.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        // eslint-disable-next-line no-console
        console.log(`[${roomId}] useYjs: Initial sync for room ${roomId} completed.`)
      }
    })
  } else {
    // eslint-disable-next-line no-console
    console.warn('useYjs: No provider options provided. Yjs will operate in offline mode.')
    status.value = 'connected' // 视为已连接，但无远程同步
  }

  // 在组件中销毁 Yjs 资源
  onUnmounted(() => {
    // eslint-disable-next-line no-console
    console.log(`useYjs: Cleaning up Yjs resources for room ${roomId}.`)
    providerManager.destroyProvider(roomId)
    // docManager.destroyDoc(roomId)
  })

  return {
    ydoc: ydoc,
    provider: provider,
    awareness: awareness,
    status: readonly(status)
  }
}
