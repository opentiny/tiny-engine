import { createPinia, defineStore } from 'pinia'
import { shallowReactive } from 'vue'
import { useAppSchema } from '../../composables/useAppSchema'
import { parseJSFunction } from '../data-function'
const stores = shallowReactive<Record<string, any>>({})
export const generateStoresConfig = () => {
  const { globalStates } = useAppSchema()
  if (globalStates.value.length === 0) return []
  return globalStates.value.map((store) => ({
    id: store.id,
    state: JSON.parse(JSON.stringify(store.state)),
    actions: Object.fromEntries(
      Object.keys(store.actions || {}).map((key) => {
        // 使用 parseJSFunction ，但是上下文由pinia内部绑定
        const fn = parseJSFunction(store.actions[key])
        if (!fn) {
          // eslint-disable-next-line no-console
          console.error(`Failed to parse action: ${key} in store: ${store.id}`)
          return [key, () => {}] // fallback to noop
        }
        return [key, fn]
      })
    ),
    getters: Object.fromEntries(
      Object.keys(store.getters || {}).map((key) => {
        // 同样处理 getters
        const fn = parseJSFunction(store.getters[key])
        if (!fn) {
          // eslint-disable-next-line no-console
          console.error(`Failed to parse getter: ${key} in store: ${store.id}`)
          return [key, () => undefined] // fallback
        }
        return [key, fn]
      })
    )
  }))
}

export const createAppStores = () => {
  const pinia = createPinia()
  const storesConfig = generateStoresConfig()
  storesConfig.forEach((config) => {
    // 使用 defineStore 创建 Pinia store
    const useStore = defineStore(config.id, {
      state: () => config.state,

      getters: config.getters,

      actions: config.actions
    })
    // 使用useStore创建 store 实例并绑定到 pinia
    stores[config.id] = useStore(pinia)
  })
  return pinia
}

export function getStore() {
  return stores
}
