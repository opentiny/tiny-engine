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
  let stopEditorAwarenessWatch: (() => void) | null = null

  const cleanupListeners = (bindFn: () => void) => {
    if (provider.value) {
      provider.value.off('sync', bindFn)
    }
  }

  const bind = () => {
    if (bound) return
    if (!awareness.value || !editorRef || !provider.value?.synced) return

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

    cleanupListeners(bind)
    // 成功绑定后可以停止对 editor/awareness 的 watch
    stopEditorAwarenessWatch?.()
    stopEditorAwarenessWatch = null
  }

  stopProviderWatch = watch(
    () => provider.value,
    (prov) => {
      if (!prov) return

      prov.once('sync', bind)
      if (prov.synced) bind()
      stopProviderWatch?.()
      stopProviderWatch = null
    },
    { immediate: true }
  )

  stopEditorAwarenessWatch = watch([() => awareness.value, () => editorRef], () => bind(), { immediate: true })

  onUnmounted(() => {
    binding?.destroy()
    cleanupListeners(bind)
    stopProviderWatch?.()
    stopEditorAwarenessWatch?.()
    stopProviderWatch = null
    stopEditorAwarenessWatch = null
  })

  return { binding, yText, ydoc, provider }
}
