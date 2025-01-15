import { shallowReactive } from 'vue'

import { getDeletedKeys } from '../data-utils'
import { isStateAccessor, parseData } from '../data-function'

export function useState({ getContext, generateStateAccessors }) {
  const state = shallowReactive({})

  const setState = (data) => {
    if (typeof data !== 'object' || data === null) {
      return
    }

    const deletedKeys = getDeletedKeys(state, data)

    // 同步删除的 key
    for (const key of deletedKeys) {
      delete state[key]
    }

    Object.assign(state, parseData(data, {}, getContext()) || {})

    // 在状态变量合并之后，执行访问器中watchEffect，为了可以在访问器函数中可以访问其他state变量
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
