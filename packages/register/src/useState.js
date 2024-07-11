import { computed, isReactive, reactive } from 'vue'

/**
 * @type {Record<string, Record<string, any>>}
 */
const stores = {}

/**
 * @param {string} name
 * @returns
 */
export const useStore = (name) => {
  if (!isReactive(stores[name])) {
    stores[name] = reactive({})
  }

  const store = stores[name]

  return {
    store,
    /**
     * @param {Record<string, any>} kv
     * @returns
     */
    patchStore: (kv) => {
      return Object.assign(store, kv)
    },
    /**
     * @param {string} key
     * @returns {[(import 'vue').ComputedRef<any>, (value: any) => void]}
     */
    useState: (key) => {
      return [
        computed(() => store[key]),
        (value) => {
          store[key] = value
        }
      ]
    }
  }
}

export const { useState } = useStore('_defaultGlobal')
