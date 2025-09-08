import { computed, onUnmounted, ref, watch } from 'vue'
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

function makeTransparent(hex: string, alpha: number): string {
  // hex: "#RRGGBB"
  if (!hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex
  let r: number, g: number, b: number

  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16)
    g = parseInt(hex.slice(3, 5), 16)
    b = parseInt(hex.slice(5, 7), 16)
  } else {
    // "#RGB" 短写
    r = parseInt(hex[1] + hex[1], 16)
    g = parseInt(hex[2] + hex[2], 16)
    b = parseInt(hex[3] + hex[3], 16)
  }

  return `rgba(${r},${g},${b},${alpha})`
}

export function useCollabMonaco(options: UseCollabMonacoOptions) {
  const { currentUser, editorRef, roomId, fieldName } = options
  const { ydoc, awareness } = useYjs(roomId, { websocketUrl: `ws://localhost:${PORT}` })

  const monacoBinding = ref<MonacoBinding | null>(null)

  watch(
    () => [awareness.value, editorRef.value],
    ([yjsAwareness, monacoComponent]) => {
      if (yjsAwareness && monacoComponent && !monacoBinding.value) {
        const editor = monacoComponent.getEditor()
        if (!editor) {
          // eslint-disable-next-line no-console
          console.error('[useMonacoCollab] 无法从 monacoComponent 获取 editor 实例。')
          return
        }

        const model = editor.getModel()
        if (!model) return

        yjsAwareness.setLocalStateField('user', {
          name: currentUser.name,
          id: currentUser.id,
          color: currentUser.color,
          colorLight: makeTransparent(currentUser.color, 0.2)
        })

        monacoBinding.value = new MonacoBinding(ydoc.getText(fieldName), model, new Set([editor]), yjsAwareness)

        // eslint-disable-next-line no-console
        console.log('[useMonacoCollab] Yjs 绑定成功！光标同步已自动激活。')

        // 监听 awareness，添加用户名标签
        // const handleAwarenessUpdate = () => {
        //     const states = (yjsAwareness as Awareness).getStates()
        //     const decorations: monaco.editor.IModelDeltaDecoration[] = []

        //     states.forEach((state, clientId) => {
        //         // 跳过自己和没有用户和光标信息的
        //         if (clientId === yjsAwareness.clientId || !state.selection || !state.user) {
        //             return
        //         }

        //         // y-monaco 已经创建了光标 找到其位置即可
        //         const headPos = model.getPositionAt(state.selection.head)

        //         // 添加一个 "用户标签" 的 decoration
        //         decorations.push({
        //             range: new monaco.Range(headPos.lineNumber, headPos.column, headPos.lineNumber, headPos.column),
        //             options: {
        //                 after: {
        //                     content: state.user.name,
        //                     // 添加一个类名，用于设置样式
        //                     inlineClassName: 'y-remote-cursor-username'
        //                 },
        //                 // 设置一个唯一的 CSS 类名，用于动态应用颜色
        //                 inlineClassName: `y-remote-user-color-${clientId}`
        //             }
        //         })
        //     })

        //     editor.deltaDecorations([], decorations)
        // }

        // yjsAwareness.on('update', handleAwarenessUpdate)
        // handleAwarenessUpdate() // 初始渲染
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    monacoBinding.value?.destroy()
    if (awareness.value) {
      awareness.value.setLocalStateField('user', null)
    }
  })

  return {
    isBindingReady: computed(() => monacoBinding.value !== null)
  }
}
