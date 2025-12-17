import { getStore } from '../app-function'

export function useStore() {
  return {
    stores: getStore()
  }
}
export { getStore }
