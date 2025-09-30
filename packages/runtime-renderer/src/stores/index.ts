import { defineStore, type Pinia } from 'pinia'
import { shallowReactive } from 'vue'
import type { StoreConfig } from '../types/config'
import { useAppSchema } from '../composables/useAppSchema'
import { parseJSFunction } from '../utils/data-utils'

export const generateStoresConfig = () => {
  const { globalStates } = useAppSchema()
  if (globalStates.value.length === 0) return []
  return globalStates.value.map((store) => ({
    id: store.id,
    state: JSON.parse(JSON.stringify(store.state)),
    actions: Object.fromEntries(
      Object.keys(store.actions || {}).map((key) => {
        // 使用 parseJSFunction ，但是上下文由pinia内部绑定
        return [key, parseJSFunction(store.actions[key], {}, {})]
      })
    ),
    getters: Object.fromEntries(
      Object.keys(store.getters || {}).map((key) => {
        // 同样处理 getters
        return [key, parseJSFunction(store.getters[key], {}, {})]
      })
    )
  }))
}

export const createStores = (storesConfig: StoreConfig[], pinia: Pinia) => {
  const stores = shallowReactive<Record<string, any>>({})

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

  return stores
}
