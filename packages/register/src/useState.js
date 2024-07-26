import { isReactive, reactive, readonly } from 'vue'

const store = {}

/**
 *
 * @param {string | Symbol} id
 * @template {Record<string, any>} T
 * @param {T} initialState
 * @returns {[(import 'vue').DeepReadonly<(import 'vue').UnwrapNestedRefs<T>>, (value: Partial<T>) => void]}
 */
export const useState = (id, initialState) => {
  if (!isReactive(store[id])) {
    store[id] = reactive({})
  }

  /**
   * @type {T}
   */
  const state = store[id]

  if (typeof initialState === 'object' && initialState !== null) {
    Object.assign(state, initialState)
  }

  return [
    readonly(state),
    (kv) => {
      Object.assign(state, kv)
    }
  ]
}
