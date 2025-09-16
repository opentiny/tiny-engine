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
  const { ydoc, awareness, provider } = useYjs(roomId, { websocketUrl: `ws://localhost:${PORT}` })

  const monacoBinding = ref<MonacoBinding | null>(null)

  watch(
    () => [awareness.value, editorRef.value, provider.value],
    ([yjsAwareness, monacoComponent, yjsProvider]) => {
      // 确保所有依赖都已就绪，并且尚未绑定
      if (yjsAwareness && monacoComponent && yjsProvider && !monacoBinding.value) {
        const editor = monacoComponent.getEditor() ? monacoComponent.getEditor() : monacoComponent
        if (!editor) {
          // eslint-disable-next-line no-console
          console.error('[useMonacoCollab] 无法从 monacoComponent 获取 editor 实例。')
          return
        }

        const model = editor.getModel()
        if (!model) {
          // eslint-disable-next-line no-console
          console.error('[useMonacoCollab] 无法获取 editor model。')
          return
        }

        const yText = ydoc.getText(fieldName)

        // 监听 provider 的 sync 事件
        const syncHandler = (isSynced: boolean) => {
          if (isSynced && !monacoBinding.value) {
            // 确保只在同步完成后只执行一次
            // 获取低代码引擎在 Monaco Editor 中生成初始内容
            const initialContentFromModel = model.getValue()

            // 检查共享文档是否为空
            if (yText.length === 0) {
              // 共享文档为空，这意味这是第一个成功的用户
              // 第一个用户职责：如果本地有初始内容，就用它来“初始化”共享文档
              if (initialContentFromModel) {
                ydoc.transact(() => {
                  yText.insert(0, initialContentFromModel)
                })
                // eslint-disable-next-line no-console
                console.log(`[useMonacoCollab] 初始化成功，已将 ${initialContentFromModel.length} 字符提交到文档。`)
              }
            } else {
              // 共享文档不为空
              // 职责：必须放弃我本地的初始内容，并完全接受共享的、权威的版本
              const sharedContent = (yText as Y.Text).toString()

              // 文档已存在内容，将使用远程版本覆盖本地 Model。
              if (model.getValue() !== sharedContent) {
                model.setValue(sharedContent)
                // eslint-disable-next-line no-console
                console.log('[useMonacoCollab] 本地 Model 已被远程内容覆盖。')
              }
            }

            // 在所有内容处理完毕之后，才创建 MonacoBinding
            yjsAwareness.setLocalStateField('user', {
              name: currentUser.name,
              id: currentUser.id,
              color: currentUser.color,
              colorLight: makeTransparent(currentUser.color, 0.2)
            })

            monacoBinding.value = new MonacoBinding(ydoc.getText(fieldName), model, new Set([editor]), yjsAwareness)

            // eslint-disable-next-line no-console
            console.log('[useMonacoCollab] Yjs 绑定成功！光标同步已自动激活。')
          }
        }

        yjsProvider.on('sync', syncHandler)

        // 如果 provider 已经同步完成（例如，在热重载后），手动触发一次
        if (yjsProvider.synced) {
          syncHandler(true)
        }
      }
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
  })

  return {
    isBindingReady: computed(() => monacoBinding.value !== null)
  }
}
