import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

export type YjsProvider = WebsocketProvider

interface ProviderOptions {
  websocketUrl?: string // WebSocket 服务器地址
  webrtcSignalingUrls?: string[] // WebRTC 信令服务器地址
}

/**
 * ProviderManager 类
 * 负责管理 Yjs 的各种 Provider（如 WebSocket, WebRTC 等），
 * 确保 Y.Doc 能够与远程服务进行同步。
 */
export class ProviderManager {
  private static instance: ProviderManager
  private providers: Map<string, YjsProvider>

  private constructor() {
    this.providers = new Map()
  }

  // 获取 ProviderManager 的单例实例。
  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager()
    }
    return ProviderManager.instance
  }

  // 创建并连接一个 Provider，目前只支持 WebsocketProvider
  public createProvider(roomId: string, ydoc: Y.Doc, options: ProviderOptions, forceNew = false): YjsProvider {
    if (this.providers.has(roomId)) {
      if (forceNew) this.destroyProvider(roomId)
      else return this.providers.get(roomId)!
    }

    if (options.websocketUrl) {
      const provider = new WebsocketProvider(options.websocketUrl, roomId, ydoc)
      this.providers.set(roomId, provider)
      return provider
    }
    // else if (options.webrtcSignalingUrls) {
    //   const provider = new WebrtcProvider(roomId, ydoc, { signaling: options.webrtcSignalingUrls });
    //   this.providers.set(roomId, provider);
    //   return provider;
    // }

    throw new Error('ProviderManager: No valid provider options provided.')
  }

  // 获取指定房间的 Provider
  public getProvider(roomId: string): YjsProvider | undefined {
    return this.providers.get(roomId)
  }

  // 断开并移除指定房间的 Provider
  public destroyProvider(roomId: string): void {
    const provider = this.providers.get(roomId)
    if (provider) {
      provider.destroy()
      this.providers.delete(roomId)
    }
  }

  // 断开并移除所有 Provider
  public destroyAllProviders(): void {
    this.providers.forEach((provider) => provider.destroy())
    this.providers.clear()
  }

  public onStatus(roomId: string, callback: (event: { status: 'connected' | 'disconnected' }) => void) {
    const provider = this.providers.get(roomId)
    if (!provider) throw new Error(`No provider found for room '${roomId}'.`)
    provider.on('status', callback)
    return () => provider.off('status', callback)
  }

  // public getAwareness(roomId: string) {
  //     return this.providers.get(roomId)?.awareness
  // }
}
