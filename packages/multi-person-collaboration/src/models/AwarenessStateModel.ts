import type { Awareness } from 'y-protocols/awareness.js'
import type { UserAwareness } from '../type'
import mitt from 'mitt'
import type { Emitter } from 'mitt'

// 定义一个通用的事件 Map
type AwarenessEvents<TState> = {
  change: { clientId: number; state: TState }
  enter: { clientId: number; state: TState }
  leave: { clientId: number }
}

/**
 * AwarenessStateModel
 * @template TState - 一个描述此场景下 awareness 状态的类型。
 *                   它必须包含一个 `user: UserAwareness` 字段。
 */
export class AwarenessStateModel<TState extends { user: UserAwareness }> {
  public readonly awareness: Awareness
  public readonly emitter: Emitter<AwarenessEvents<TState>>
  private previousStates: Map<number, TState> = new Map()

  constructor(awareness: Awareness) {
    this.awareness = awareness
    this.emitter = mitt<AwarenessEvents<TState>>()
    this.awareness.on('update', this.handleStateChange)
    this.previousStates = new Map(this.awareness.getStates() as Map<number, TState>)
  }

  // 更新本地状态的任意字段
  public updateLocalStateField<K extends keyof TState>(field: K, value: TState[K]): void {
    this.awareness.setLocalStateField(field as string, value)
  }

  private handleStateChange = (changes: { added: number[]; updated: number[]; removed: number[] }): void => {
    const newStates = this.awareness.getStates() as Map<number, TState>

    for (const clientId of changes.added) {
      const state = newStates.get(clientId)
      if (state) {
        this.emitter.emit('enter', { clientId, state })
      }
    }

    for (const clientId of changes.updated) {
      if (clientId === this.awareness.clientID) continue
      const newState = newStates.get(clientId)
      const oldState = this.previousStates.get(clientId)
      // 只在状态真正改变时才触发事件
      if (newState && JSON.stringify(newState) !== JSON.stringify(oldState)) {
        this.emitter.emit('change', { clientId, state: newState })
      }
    }

    for (const clientId of changes.removed) {
      this.emitter.emit('leave', { clientId })
    }

    this.previousStates = new Map(newStates)
  }

  public destroy(): void {
    this.awareness.off('update', this.handleStateChange)
    this.emitter.all.clear()
  }
}
