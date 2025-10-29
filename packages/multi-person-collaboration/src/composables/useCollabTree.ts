import { PORT } from '../config'
import type { UserAwareness } from '../type'
import { useAwareness } from './useAwareness'
import { useYjs } from './useYjs'

interface UseCollabDragOptions {
  roomId: string
  currentUser: UserAwareness
  // 节流等待时间
  throttleWait?: number
}

interface DragAwarenessState {
  user: UserAwareness
  drag?: {
    status: 'start' | 'drag' | 'end'
    nodeId: string
    initialPosition: { x: number; y: number } // 拖拽开始时的初始位置
    currentPosition: { x: number; y: number } // 拖拽过程中的当前位置
  } | null
}
/**
 * useCollabDrag Composable
 * 负责通过 Y.js Awareness 同步拖拽操作的实时状态。
 */
export function useCollabTree(options: UseCollabDragOptions) {
  const { roomId, currentUser } = options
  const { awareness } = useYjs(roomId, { websocketUrl: `ws://localhost:${PORT}` })

  const { remoteStates, updateLocalStateField } = useAwareness<DragAwarenessState>(awareness, currentUser)

  // 开始拖拽
  const startDrag = (nodeId: string, initialPosition: { x: number; y: number }): void => {
    updateLocalStateField('drag', {
      status: 'start',
      nodeId,
      initialPosition,
      currentPosition: initialPosition
    })
  }

  // 更新拖拽位置
  const updateDrag = (currentPosition: { x: number; y: number }): void => {
    const currentDragState = awareness.value?.getLocalState()?.drag as DragAwarenessState['drag']

    if (currentDragState && currentDragState.status !== 'end') {
      updateLocalStateField('drag', {
        ...currentDragState,
        status: 'drag',
        currentPosition
      })
    }
  }

  // 结束当前的拖拽
  const endDrag = (): void => {
    // 在结束拖拽时，立即取消任何待处理的节流调用
    // updateDrag.cancel()

    const currentDragState = awareness.value?.getLocalState()?.drag as DragAwarenessState['drag']

    if (currentDragState) {
      // 广播一个 end 状态
      updateLocalStateField('drag', {
        ...currentDragState,
        status: 'end'
      })

      // 短暂延迟后，将拖拽状态设为 null，彻底清除
      // 这个延迟非常重要，确保了 'end' 状态有足够的时间被广播和接收
      setTimeout(() => {
        const finalDragState = awareness.value?.getLocalState()?.drag as DragAwarenessState['drag']
        if (finalDragState && finalDragState.status === 'end') {
          updateLocalStateField('drag', null)
        }
      }, 200)
    }
  }

  return {
    remoteDragStates: remoteStates,
    startDrag,
    updateDrag,
    endDrag
  }
}
