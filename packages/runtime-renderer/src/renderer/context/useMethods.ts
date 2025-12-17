import { shallowReactive } from 'vue'
import { parseData } from '../data-function/index'
import type { IFuntion } from '../../types/index'
export function useMethods(scope: any = {}, context: any = {}) {
  const methods = shallowReactive<Record<string, IFuntion>>({})
  const setMethods = (methodsObj: Record<string, any>) => {
    for (const key in methodsObj) {
      const method = methodsObj[key]
      methods[key] = parseData(method, scope, context) as IFuntion
    }
  }
  const delMethods = (key: string) => {
    delete methods[key]
  }
  const getMethods = () => methods
  return {
    methods,
    setMethods,
    delMethods,
    getMethods
  }
}
