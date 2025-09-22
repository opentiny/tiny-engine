import { onMounted } from 'vue'
import { PORT } from '../config'
import type { UserAwareness } from '../type'
import { useAwareness } from './useAwareness'
import { useYjs } from './useYjs'

export interface CursorAwarenessState {
  user: UserAwareness
  cursor?: {
    x: number
    y: number
    pressed: boolean
  }
}

interface UserCollabCursorOptions {
  roomId: string
  currentUser: UserAwareness
}

/**
 * useCollabCursor Composable
 * 职责:
 * 1. 整合 Y.Awareness，专门处理光标的实时同步。
 * 2. 提供对远程用户光标位置的响应式数据。
 * 3. 监听本地鼠标事件并更新本地光标状态。
 */
export function useCollabCursor(options: UserCollabCursorOptions) {
  const { roomId, currentUser } = options
  const { awareness } = useYjs(roomId, { websocketUrl: `ws://localhost:${PORT}` })
  const { remoteStates, updateLocalStateField } = useAwareness<CursorAwarenessState>(awareness, currentUser)

  // 更新本地光标位置的方法
  const updateCursorPositioin = (event: MouseEvent) => {
    updateLocalStateField('cursor', {
      x: event.pageX,
      y: event.pageY,
      pressed: event.buttons === 1
    })
  }

  // 更新本地光标按下状态的方法
  const updateCursorPressedState = (pressed: boolean) => {
    const localState = awareness.value?.getLocalState() as CursorAwarenessState | undefined

    const currentX = localState?.cursor?.x || 0
    const currentY = localState?.cursor?.y || 0

    updateLocalStateField('cursor', {
      x: currentX,
      y: currentY,
      pressed
    })
  }

  const mouseDownHandler = () => updateCursorPressedState(true)
  const mouseUpHandler = () => updateCursorPressedState(false)

  onMounted(() => {
    updateLocalStateField('cursor', {
      x: -1, // 使用一个屏幕外的值作为初始位置
      y: -1,
      pressed: false
    })
  })

  return {
    remoteCursors: remoteStates,
    updateCursorPositioin,
    mouseDownHandler,
    mouseUpHandler
  }
}
