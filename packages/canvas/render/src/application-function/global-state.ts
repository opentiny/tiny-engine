import { ref, shallowReactive, watchEffect, reactive, computed } from 'vue'
import { reset } from '../data-utils'

export function useGlobalState() {
  const globalState = ref<any[]>([])

  const setGlobalState = (data: any[] = []) => {
    globalState.value = data
  }

  const stores = shallowReactive<Record<string, any>>({})

  watchEffect(() => {
    reset(stores)
    
    globalState.value.forEach(({ id, state = {}, getters = {} }) => {
      try {
        const reactiveState = reactive({ ...state })
        const store = reactive({ ...reactiveState })
        
        if (getters && typeof getters === 'object') {
          Object.entries(getters).forEach(([key, getterDef]: [string, any]) => {
            try {
              if (getterDef?.type === 'JSFunction' && getterDef.value) {
                const getterFn = new Function(`return (${getterDef.value})`)()
                const computedGetter = computed(() => {
                  try {
                    return getterFn.call(store, reactiveState)
                  } catch (error) {
                    console.error(`[useGlobalState] Error in getter "${key}" (store ${id}):`, error)
                    return null
                  }
                })

                Object.defineProperty(store, key, {
                  get: () => computedGetter.value,
                  enumerable: true,
                })
              }
            } catch (parseError) {
              console.error(`[useGlobalState] Invalid getter "${key}" in store ${id}:`, parseError)
            }
          })
        }
        
        stores[id] = store
      } catch (storeError) {
        console.error(`[useGlobalState] Failed to create store "${id}":`, storeError)
      }
    })
  })

  return {
    globalState,
    setGlobalState,
    stores
  }
}