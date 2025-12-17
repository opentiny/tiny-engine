import { getUtilsAll } from '../app-function'

export function useUtils() {
  return {
    utils: getUtilsAll()
  }
}

export { getUtilsAll }
