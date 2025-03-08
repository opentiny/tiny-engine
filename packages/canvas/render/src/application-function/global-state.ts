import { ref, shallowReactive, watchEffect } from 'vue'
import { reset } from '../data-utils'

const Func = Function

export function useGlobalState() {
  const globalState = ref([])

  const setGlobalState = (data = []) => {
    globalState.value = data
  }
  const stores = shallowReactive({})
  watchEffect(() => {
    reset(stores)
    globalState.value.forEach(({ id, state = {}, getters = {} }) => {
      const hasGetters = Object.keys(getters).length > 0

      if (Array.isArray(state)) {
        if (!hasGetters) {
          stores[id] = [...state]
        } else {
          const computedGetters = {}
          Object.keys(getters).forEach((key) => {
            try {
              computedGetters[key] = new Func('return ' + getters[key])().call(computedGetters, state)
            } catch (error) {
              computedGetters[key] = undefined
            }
          })

          const arrayWithGetters = [...state]
          Object.assign(arrayWithGetters, computedGetters)
          stores[id] = arrayWithGetters
        }
      } else if (typeof state !== 'object' || state === null) {
        stores[id] = state
      } else {
        if (!hasGetters) {
          stores[id] = { ...state }
        } else {
          const computedGetters = {}
          Object.keys(getters).forEach((key) => {
            try {
              computedGetters[key] = new Func('return ' + getters[key])().call(computedGetters, state)
            } catch (error) {
              computedGetters[key] = undefined
            }
          })

          stores[id] = Object.assign({}, state, computedGetters)
        }
      }
    })
  })
  return {
    globalState,
    setGlobalState,
    stores
  }
}
