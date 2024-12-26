import { reactive, watchEffect } from 'vue'
import { reset } from '../data-utils'
import { useAccessorMap } from './accessor-map'
import { useState } from './state'
import { useProps } from './props'
import { useMethods } from './methods'
import { nextTick } from 'vue'
import { globalNotify } from '../canvas-function'
import { setPagecss } from './css'
import type { IPageSchema, ISchemaChildrenItem } from '@opentiny/tiny-engine-dsl-vue'
export { IPageSchema, ISchemaChildrenItem }

export function useSchema(
  { context: globalContext, setContext, getContext, clearNodes, getNode },
  { utils, bridge, stores, getDataSourceMap }
) {
  const schema = reactive<Partial<IPageSchema>>({})
  const { generateAccessor, stateAccessorMap, propsAccessorMap, generateStateAccessors } = useAccessorMap(globalContext)

  const { state, getState, setState, deleteState } = useState(schema, {
    getContext,
    generateStateAccessors
  })

  const { props, initProps, getProps, setProps } = useProps(generateAccessor)

  const { methods, getMethods, setMethods } = useMethods({
    setContext,
    getContext
  })

  const getSchema = () => schema
  const setSchema = async (data: IPageSchema) => {
    const newSchema = JSON.parse(JSON.stringify(data || schema))
    reset(schema)
    // 页面初始化的时候取消所有状态变量的watchEffect监听
    stateAccessorMap.forEach((stateAccessorFn) => {
      stateAccessorFn()
    })

    // 区块初始化的时候取消所有的区块属性watchEffect监听
    propsAccessorMap.forEach((propsAccessorFn) => {
      propsAccessorFn()
    })

    // 清空存状态变量和区块props访问器的缓存
    stateAccessorMap.clear()
    propsAccessorMap.clear()

    const context = {
      utils,
      bridge,
      stores,
      state,
      props,
      dataSourceMap: {},
      emit: () => {} // 兼容访问器中getter和setter中this.emit写法
    }
    Object.defineProperty(context, 'dataSourceMap', {
      // TODO: defineProperty不可枚举会在setContext中Object.assign时不能被枚举，理论上无效
      get: getDataSourceMap
    })
    // 此处提升很重要，因为setState、initProps也会触发画布重新渲染，所以需要提升上下文环境的设置时间
    setContext(context, true)

    // 设置方法调用上下文
    setMethods(newSchema.methods, true)

    // 如果是区块则需要设置对外暴露的props
    const accessorFunctions = initProps(newSchema.schema?.properties)

    // 这里setState（会触发画布渲染），是因为状态管理里面的变量会用到props、utils、bridge、stores、methods
    setState(newSchema.state, true)
    clearNodes()
    await nextTick()
    setPagecss(data.css)
    Object.assign(schema, newSchema)

    // 当上下文环境设置完成之后再去处理区块属性访问器的watchEffect
    accessorFunctions.forEach(({ property, accessorFn, type }) => {
      const propsWatchEffectKey = `${property}${type}`
      propsAccessorMap.set(
        propsWatchEffectKey,
        watchEffect(() => {
          try {
            accessorFn()
          } catch (error) {
            globalNotify({
              type: 'warning',
              title: `区块属性${property}的访问器函数:${accessorFn.name}执行报错`,
              message: error?.message || `区块属性${property}的访问器函数:${accessorFn.name}执行报错，请检查语法`
            })
          }
        })
      )
    })

    return schema
  }
  return {
    schema,
    getSchema,
    setSchema,
    ...{
      generateAccessor,
      stateAccessorMap,
      propsAccessorMap,
      generateStateAccessors
    },
    ...{
      state,
      getState,
      setState,
      deleteState
    },
    ...{
      props,
      initProps,
      getProps,
      setProps
    },
    ...{
      methods,
      getMethods,
      setMethods
    },
    ...{
      getContext,
      getNode
    },
    setPagecss
  }
}
