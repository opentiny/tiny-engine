import { reactive } from 'vue'
import { getDeletedKeys } from '../../utils/data-utils'
import { isStateAccessor, parseData } from '../parser'
import { useAccessorMap } from './accessor'

export function useState({ getContext }: { getContext: () => any }) {
  const state = reactive<Record<string, any>>({})
  const { generateStateAccessors } = useAccessorMap(getContext())

  const setState = (data: Record<string, any>, clear?: boolean) => {
    if (typeof data !== 'object' || data === null) {
      return
    }

    if (clear) {
      Object.keys(state).forEach((key) => delete (state as any)[key])
    }

    // 智能删除处理：删除不再存在的状态键
    const deletedKeys = getDeletedKeys(state, data)
    for (const key of deletedKeys) {
      delete state[key]
    }

    Object.assign(state, parseData(data, {}, getContext()) || {})

    // 处理状态访问器
    Object.entries(data || {})?.forEach(([key, stateData]: [string, any]) => {
      if (isStateAccessor(stateData)) {
        const accessor = stateData.accessor
        if (accessor?.getter?.value) {
          generateStateAccessors('getter', accessor, key)
        }

        if (accessor?.setter?.value) {
          generateStateAccessors('setter', accessor, key)
        }
      }
    })
  }

  return {
    state,
    setState
  }
}
