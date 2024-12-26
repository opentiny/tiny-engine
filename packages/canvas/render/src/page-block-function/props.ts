import { reset } from '../data-utils'
import { useAccessorMap } from './accessor-map'

export function useProps(generateAccessor: ReturnType<typeof useAccessorMap>['generateAccessor']) {
  const props = {}
  const setProps = (data: Record<string, any>, clear = false) => {
    clear && reset(props)
    Object.assign(props, data)
  }

  const getProps = () => props

  const initProps = (properties = []) => {
    const props: Record<string, any> = {}
    const accessorFunctions: Array<ReturnType<typeof generateAccessor>> = []

    properties.forEach(({ content = [] }) => {
      content.forEach(({ defaultValue, property, accessor }) => {
        // 如果没有设置defaultValue就是undefined这和vue处理方式一样
        props[property] = defaultValue

        // 如果区块属性有访问器accessor，则先解析getter和setter函数
        if (accessor?.getter?.value) {
          // 此处不能直接执行watchEffect，需要在上下文环境设置好之后去执行，此处只是收集函数
          accessorFunctions.push(generateAccessor('getter', accessor, property))
        }

        if (accessor?.setter?.value) {
          accessorFunctions.push(generateAccessor('setter', accessor, property))
        }
      })
    })

    setProps(props, true)

    return accessorFunctions
  }
  return {
    props,
    initProps,
    getProps,
    setProps
  }
}
