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

export const getDeletedKeys = (objA, objB) => {
  const keyA = Object.keys(objA)
  const keyB = new Set(Object.keys(objB))

  return keyA.filter((item) => !keyB.has(item))
}
