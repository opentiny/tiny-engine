import { reset } from '../data-utils'
import { parseData } from '../data-function'
import type { IFuncType } from '@opentiny/tiny-engine-dsl-vue'

export function useMethods({ getContext, setContext }) {
  const methods: Record<string, Function> = {}
  const getMethods = () => methods

  const setMethods = (data: Record<string, IFuncType> = {}, clear = false) => {
    clear && reset(methods)
    // 这里有些方法在画布还是有执行的必要的，比如说表格的renderer和formatText方法，包括一些自定义渲染函数
    Object.assign(
      methods,
      Object.fromEntries(
        Object.keys(data).map((key) => {
          return [key, parseData(data[key], {}, getContext())]
        })
      )
    )
    setContext(methods)
  }
  return {
    methods,
    getMethods,
    setMethods
  }
}
