import { newFn } from './parser'
export function generateFunction(rawCode: any, context = {}) {
  try {
    return newFn(`return (${rawCode})`).call(context).bind(context)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`generateFunction error: ${JSON.stringify(error)}`)
    return null
  }
}
export const reset = (obj) => {
  Object.keys(obj).forEach((key) => delete obj[key])
}

// 用于解析store中的actions和getters
export const parseJSFunction = (data: any, _scope: any = null, _ctx: any = null) => {
  try {
    const fn = newFn(`return ${data.value}`).call(null) // 拿到函数本体，不绑定任何 this
    return fn
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('函数声明解析报错:', error, data)
  }
}

export const getDeletedKeys = (objA, objB) => {
  const keyA = Object.keys(objA)
  const keyB = new Set(Object.keys(objB))

  return keyA.filter((item) => !keyB.has(item))
}
