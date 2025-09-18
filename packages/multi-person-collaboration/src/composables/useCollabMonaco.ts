import { computed, onUnmounted, ref, watch } from 'vue'
import { PORT } from '../config'
import { useYjs } from './useYjs'
import { MonacoBinding } from 'y-monaco'
import type { UserAwareness } from '../type'
import * as Y from 'yjs'

interface UseCollabMonacoOptions {
  currentUser: UserAwareness
  editorRef: any
  roomId: string
  fieldName: string
}

function makeTransparent(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex
  let r: number, g: number, b: number
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  } else {
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  }
  return `rgba(${r},${g},${b},${alpha})`
}

export function useCollabMonaco(options: UseCollabMonacoOptions) {
  const { currentUser, editorRef, roomId, fieldName } = options
  const { ydoc, awareness, provider } = useYjs(roomId, { websocketUrl: `ws://localhost:${PORT}` })
  const monacoBinding = ref<MonacoBinding | null>(null)

  // 防止重复初始化
  let bindingInitialized = false
  let isApplyingRemote = false

  watch(
    () => [awareness.value, editorRef.value, provider.value],
    ([yjsAwareness, monacoComponent, yjsProvider]) => {
      if (!yjsAwareness || !monacoComponent || !yjsProvider) return
      if (bindingInitialized) return

      const editor = monacoComponent.getEditor ? monacoComponent.getEditor() : monacoComponent
      // eslint-disable-next-line no-console
      if (!editor) return console.error('[useCollabMonaco] 无法获取 editor 实例。')

      const model = editor.getModel()
      // eslint-disable-next-line no-console
      if (!model) return console.error('[useCollabMonaco] 无法获取 editor model。')

      const yText: Y.Text = ydoc.getText(fieldName)

      const syncHandler = (isSynced: boolean) => {
        if (!isSynced || bindingInitialized) return

        // 初始化 editor 内容
        const localValue = model.getValue()
        if (yText.length === 0) {
          // 第一个用户初始化 Y.Text
          if (localValue) {
            ydoc.transact(() => yText.insert(0, localValue))
            // eslint-disable-next-line no-console
            console.log(`[useCollabMonaco] 初始化成功，已提交 ${localValue.length} 字符`)
          }
        } else {
          // 已有内容，覆盖本地 editor
          const sharedValue = yText.toString()
          if (localValue !== sharedValue) {
            isApplyingRemote = true
            model.setValue(sharedValue)
            isApplyingRemote = false
            // eslint-disable-next-line no-console
            console.log('[useCollabMonaco] 本地 editor 已被远程内容覆盖')
          }
        }

        // 设置本地 awareness 信息
        yjsAwareness.setLocalStateField('user', {
          name: currentUser.name,
          id: currentUser.id,
          color: currentUser.color,
          colorLight: makeTransparent(currentUser.color, 0.2)
        })

        // 创建 MonacoBinding
        monacoBinding.value = new MonacoBinding(yText, model, new Set([editor]), yjsAwareness)

        // 拦截编辑器事件，防止初始化回写循环
        const originalListener = (monacoBinding.value as any)['_onDidChangeModelContent'] as (
          e: any
        ) => void | undefined
        if (originalListener) {
          ;(monacoBinding.value as any)['_onDidChangeModelContent'] = (event: any) => {
            if (isApplyingRemote) return
            originalListener(event)
          }
        }

        bindingInitialized = true
        // eslint-disable-next-line no-console
        console.log('[useCollabMonaco] MonacoBinding 已创建，光标同步激活')
      }

      yjsProvider.on('sync', syncHandler)
      if (yjsProvider.synced) syncHandler(true)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (monacoBinding.value) {
      monacoBinding.value.destroy()
      monacoBinding.value = null
    }
    if (awareness.value) {
      awareness.value.setLocalStateField('user', null)
    }
    bindingInitialized = false
  })

  return {
    isBindingReady: computed(() => monacoBinding.value !== null)
  }
}
