import { onUnmounted, watch } from 'vue'
import { PORT } from '../config'
import { useYjs } from './useYjs'
import { MonacoBinding } from 'y-monaco'
import type { UserAwareness } from '../type'

interface UseCollabMonacoOptions {
  currentUser: UserAwareness
  editorRef: any
  roomId: string
  fieldName: string
}

export function useCollabMonaco(options: UseCollabMonacoOptions) {
  const { currentUser, editorRef, roomId, fieldName } = options
  const { ydoc, awareness, provider } = useYjs(roomId, {
    websocketUrl: `ws://localhost:${PORT}`
  })

  const yText = ydoc.getText(fieldName)
  let binding: MonacoBinding | null = null
  let bound = false
  let stopProviderWatch: (() => void) | null = null

  // 定义一个清理函数，用来移除所有监听器
  function cleanupListeners(bindFn: () => void) {
    if (provider.value) {
      provider.value.off('sync', bindFn)
    }
  }

  // 封装绑定逻辑
  const bind = () => {
    if (bound) return

    if (!awareness.value || !editorRef || !provider.value?.synced) {
      return
    }

    const model = editorRef.getModel()
    if (!model) {
      // eslint-disable-next-line no-console
      console.error('[useCollabMonaco] Model not found.')
      return
    }

    awareness.value.setLocalStateField('user', currentUser)
    binding = new MonacoBinding(yText, model, new Set([editorRef]), awareness.value)
    bound = true
    // eslint-disable-next-line no-console
    console.log('[useCollabMonaco] Binding successful.')

    // 成功绑定后，清理所有用于触发绑定的监听器
    cleanupListeners(bind)
  }

  // 监听 provider 的就绪
  stopProviderWatch = watch(
    () => provider.value,
    (prov) => {
      if (!prov) return

      // 使用 once 监听 sync 事件
      prov.once('sync', bind)

      // 如果已经同步，立即尝试绑定
      if (prov.synced) {
        bind()
      }

      // provider 出现后即可停止对 provider 自身的 watch
      stopProviderWatch?.()
    },
    { immediate: true }
  )

  // 监听其他依赖
  const stopEditorAwarenessWatch = watch(
    [() => awareness.value, () => editorRef],
    () => {
      // 当 editor 和 awareness 准备好后，也尝试绑定
      bind()
      // 如果绑定成功，也可以停止这个 watch
      if (bound) {
        stopEditorAwarenessWatch()
      }
    },
    { immediate: true }
  )

  // 在 onUnmounted 中执行最终的清理
  onUnmounted(() => {
    binding?.destroy()
    cleanupListeners(bind) // 确保所有监听器都被移除
    // ydoc 和 provider 的销毁由上层决定
  })

  return { binding, yText, ydoc, provider }
}
