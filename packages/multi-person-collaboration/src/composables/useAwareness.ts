import { onUnmounted, reactive, shallowRef, watch, type Ref } from 'vue'
import type { UserAwareness } from '../type'
import type { Awareness } from 'y-protocols/awareness.js'
import { AwarenessStateModel } from '../models/AwarenessStateModel'

/**
 * useAwareness
 * @template TState - 描述此场景下 awareness 状态的类型。
 */
export function useAwareness<TState extends { user: UserAwareness }>(
  yjsAwareness: Readonly<Ref<Awareness | null>>,
  currentUser: UserAwareness
) {
  const model = shallowRef<AwarenessStateModel<TState> | null>()
  const remoteStates = reactive<Record<number, TState>>({})

  watch(
    yjsAwareness,
    (awarenessInstance) => {
      model.value?.destroy()
      if (awarenessInstance) {
        const newModel = new AwarenessStateModel<TState>(awarenessInstance)
        model.value = newModel

        // eslint-disable-next-line no-console
        console.log(`[useAwareness] useAwareness is contected`)

        // 设置初始状态
        newModel.updateLocalStateField('user', currentUser as TState['user'])

        newModel.emitter.on('enter', ({ clientId, state }) => {
          remoteStates[clientId] = state
          // eslint-disable-next-line no-console
          console.log('User entered:', clientId, remoteStates)
        })

        newModel.emitter.on('change', ({ clientId, state }) => {
          remoteStates[clientId] = state
          // eslint-disable-next-line no-console
          console.log('User changed:', clientId, remoteStates)
        })

        newModel.emitter.on('leave', ({ clientId }) => {
          delete remoteStates[clientId]
          // eslint-disable-next-line no-console
          console.log('User left:', clientId, remoteStates)
        })
      }
    },
    { immediate: true }
  )

  // 一个通用的、类型安全的方法，用于更新本地状态的某个字段
  const updateLocalStateField = <K extends keyof TState>(field: K, value: TState[K]) => {
    model.value?.updateLocalStateField(field, value)
  }

  onUnmounted(() => model.value?.destroy())

  return {
    remoteStates,
    updateLocalStateField
  }
}
