import { watchEffect, WatchStopHandle } from 'vue'
import { generateFunction } from '../data-utils'
import { globalNotify } from '../canvas-function'

type IAccessorType = 'getter' | 'setter'
interface IAccessor {
  getter: { value: string }
  setter: { value: string }
}

export function useAccessorMap(context) {
  const generateAccessor = (type: IAccessorType, accessor: IAccessor, property: string) => {
    const accessorFn = generateFunction(accessor[type].value, context) as Function

    return { property, accessorFn, type }
  }

  // 这里缓存状态变量对应的访问器，用于watchEffect更新和取消监听
  const stateAccessorMap = new Map<string, WatchStopHandle>()

  // 缓存区块属性的访问器
  const propsAccessorMap = new Map<string, WatchStopHandle>()

  const generateStateAccessors = (type: IAccessorType, accessor: IAccessor, key: string) => {
    const stateWatchEffectKey = `${key}${type}`
    const { property, accessorFn } = generateAccessor(type, accessor, key)

    // 将之前已有的watchEffect取消监听,这里操作很有必要，不然会造成数据混乱
    stateAccessorMap.get(stateWatchEffectKey)?.()

    // 更新watchEffect监听
    stateAccessorMap.set(
      stateWatchEffectKey,
      watchEffect(() => {
        try {
          accessorFn()
        } catch (error) {
          globalNotify({
            type: 'warning',
            title: `状态变量${property}的访问器函数:${accessorFn.name}执行报错`,
            message: error?.message || `状态变量${property}的访问器函数:${accessorFn.name}执行报错，请检查语法`
          })
        }
      })
    )
  }

  return {
    generateAccessor,
    stateAccessorMap,
    propsAccessorMap,
    generateStateAccessors
  }
}
