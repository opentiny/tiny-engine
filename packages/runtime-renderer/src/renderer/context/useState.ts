import { reactive } from 'vue'
import { getDeletedKeys } from '../data-function'
import { useAccessorMap } from '../page-function/accessor'
import { isStateAccessor, parseData } from '../data-function/index'

export function useState(scope: any = {}, context: any = {}) {
  // 改成使用 reactive, 处理state.xxx.xxx双向绑定
  const state = reactive<Record<string, any>>({})
  const { generateStateAccessors } = useAccessorMap(context)

  const setState = (data: Record<string, any>) => {
    if (typeof data !== 'object' || data === null) {
      return
    }
    // 同步删除的 key
    const deletedKeys = getDeletedKeys(state, data)
    deletedKeys?.forEach((key) => delete state[key])
    Object.assign(state, parseData(data, scope, context) || {})
    // 在状态变量合并之后，执行访问器中watchEffect，为了可以在访问器函数中可以访问其他state变量
    Object.entries(data || {})?.forEach(([key, stateData]: [string, any]) => {
      if (isStateAccessor(stateData)) {
        const accessor = stateData.accessor
        if (accessor?.getter?.value) {
          generateStateAccessors('getter', accessor, key)
        }

        if (accessor?.setter?.value) {
          generateStateAccessors('setter', accessor, key)
        }
      }
    })
  }
  return {
    state,
    setState
  }
}
