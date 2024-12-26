import { shallowReactive } from 'vue'

import { reset } from '../data-utils'
import { isStateAccessor, parseData } from '../data-function'

export function useState(schema, { getContext, generateStateAccessors }) {
  const state = shallowReactive({})
  const getState = () => state

  const deleteState = (variable: string) => {
    delete state[variable]
  }

  const setState = (data, clear = false) => {
    clear && reset(state)
    if (!schema.state) {
      schema.state = data
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
    getState,
    setState,
    deleteState
  }
}
