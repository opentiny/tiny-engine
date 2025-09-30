import { utils as commonUtils } from '@opentiny/tiny-engine-utils'
export const { parseFunction: generateFunction } = commonUtils

export const reset = (obj) => {
  Object.keys(obj).forEach((key) => delete obj[key])
}

// 规避创建function eslint报错
export const newFn = (...argv) => {
  const Fn = Function
  return new Fn(...argv)
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
