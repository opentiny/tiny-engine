import { computed, isReactive, reactive } from 'vue'

/**
 * 对象转换成数组，对象的key转换成id字段，使用_order字段排序
 * @param {Record<string, any>} obj
 * @returns
 */
const objToArray = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return []
  }

  const result = Object.entries(obj)
    .map(([key, value]) => ({ ...value, id: key }))
    .map(({ _order, ...rest }) => ({ ...rest, _order: _order ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...rest }) => rest)

  return result
}

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
     */
    patchStore: (kv) => {
      Object.assign(store, kv)
      return store
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
    },
    toArrayOfObjects: () => objToArray(store)
  }
}

export const { useState: useShareState } = useStore('_defaultGlobal')
