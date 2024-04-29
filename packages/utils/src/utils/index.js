/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { isRef, isProxy, unref, toRaw } from 'vue'
import { isObject, isArray } from '@opentiny/vue-renderless/grid/static'

export const fun_ctor = Function

/**
 * 解析表达式字符串
 * @param {string} rawCode 表达式字符串
 * @param {object} context 调用的上下文
 * @returns any
 */
export function parseExpression(rawCode, context = {}) {
  try {
    return fun_ctor(`return (${rawCode})`).call(context)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`parseExpression error: ${error}`)
    return undefined
  }
}

/**
 * 解析函数字符串成函数
 * @param {string} rawCode 字符串函数
 * @param {object} context 需要绑定的函数上下文
 * @returns Function
 */
export function parseFunction(rawCode, context = {}) {
  try {
    return fun_ctor(`return (${rawCode})`).call(context).bind(context)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`parseFunction error: ${JSON.Stringify(error)}`)

    return null
  }
}

/**
 * 将字符串包含的特殊正则字符逃逸出来 （加上 \\）
 * 适用于 new Regexp(`${str}`)的情形，防止变量 str 具有一些特殊的正则字符串导致挂掉或者不符合期望
 * @param {string} value 字符串
 * @returns escape  之后的字符串
 */
export const escapeRegExp = (value) => {
  const reg = /[\\^$.*+?()[\]{}|]/g
  const str = String(value)

  return str.replace(reg, '\\$&')
}

// prefer old unicode hacks for backward compatibility
// https://base64.guru/developers/javascript/examples/unicode-strings
export const utoa = (string) => btoa(unescape(encodeURIComponent(string)))

export const atou = (base64) => decodeURIComponent(escape(atob(base64)))

/**
 * Create a cached version of a pure function.
 */
function cached(fn) {
  const cache = Object.create(null)
  return function cachedFn(str) {
    if (!cache[str]) {
      cache[str] = fn(str)
    }
    return cache[str]
  }
}

/**
 * Camelize a hyphen-delimited string.
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str) => {
  return str.replace(camelizeRE, (_, c) => {
    return c ? c.toUpperCase() : ''
  })
})

/**
 * Capitalize a string.
 */
export const capitalize = cached((str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

export const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str) => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

/**
 * get random id
 */
export const guid = () => {
  return 'xxxxxxxx'.replace(/[x]/g, (c) => {
    const random = parseFloat('0.' + crypto.getRandomValues(new Uint32Array(1))[0])
    const r = (random * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const getEnumData = (item) => {
  if (item.enum && item.enumNames) {
    return item.enum.map((value, index) => ({ value, text: item.enumNames[index] }))
  }
  return undefined
}

export const mapTree = (obj = {}, handler, childName = 'children') => {
  const children = obj[childName]
  const node = handler(obj)
  if (Array.isArray(children)) {
    node[childName] = children.map((child) => mapTree(child, handler))
  }

  return node
}

export const mapObj = (source, handler, rootKey) => {
  const caller = (obj, key) => {
    const { item, deep } = handler(obj, key)

    return deep ? mapObj(item, handler, key) : item
  }

  if (isArray(source)) {
    return source.map((obj) => caller(obj, rootKey))
  }

  if (source && isObject(source)) {
    return Object.keys(source).reduce((output, key) => {
      output[key] = caller(source[key], rootKey || key)

      return output
    }, {})
  }

  return source
}

export const getDefaultProps = (properties = []) => {
  const props = {}

  properties.forEach(({ content = [] }) => {
    content.forEach(({ defaultValue, schema, property }) => {
      const value = Array.isArray(schema) ? getDefaultProps(schema) : defaultValue

      if (value) {
        props[property] = value
      }
    })
  })

  return props
}

export function generateRandomLetters(length = 1) {
  let result = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < length; i++) {
    const random = parseFloat('0.' + crypto.getRandomValues(new Uint32Array(1))[0])
    result += chars.charAt(Math.floor(random * chars.length))
  }
  return result
}

export function getRawValue(target) {
  let res = target

  if (isRef(res)) {
    res = unref(res)
  }

  if (isProxy(res)) {
    return toRaw(res)
  }

  return res
}

export function getType(val) {
  let type = typeof val

  if (type !== 'object') {
    return type
  }

  return Object.prototype.toString.call(val).replace(/\[object (.*)\]/, '$1')
}

function cloneArray(target, map, _deepClone) {
  let res = []

  map.set(target, res)

  target.forEach((item, index) => {
    res[index] = _deepClone(item, map)
  })

  return res
}

function cloneMap(target, map, _deepClone) {
  let res = new Map()

  map.set(target, res)

  target.forEach((value, key) => {
    res.set(key, _deepClone(value, map))
  })

  return res
}

function cloneSet(target, map, _deepClone) {
  let res = new Set()

  map.set(target, res)

  target.forEach((value) => {
    res.add(_deepClone(value, map))
  })

  return res
}

function cloneObject(target, map, _deepClone) {
  const res = {}

  map.set(target, res)

  Object.entries(target).forEach(([key, value]) => {
    res[key] = _deepClone(value, map)
  })

  return res
}

export function nativeDeepClone(target) {
  try {
    return structuredClone(target)
  } catch (error) {
    // target is no serializable
    return undefined
  }
}

/**
 * 使用 JSON.stringify 进行 deep clone
 * 不支持 Map、Set、Date、RegExp、ArrayBuffer 等变量类型
 * 不支持循环引用
 * @param {*} target target to be copy
 * @param {*} callback target copyed
 */
export function jsonDeepClone(target, callback) {
  try {
    JSON.parse(JSON.stringify(target))
  } catch (error) {
    if (typeof callback === 'function') {
      callback()
    }
  }
}

const copyMethodMap = {
  Array: cloneArray,
  Map: cloneMap,
  Set: cloneSet,
  Object: cloneObject
}

function _deepClone(target, map) {
  if (map.has(target)) {
    return map.get(target)
  }

  const copyTarget = getRawValue(target)
  const basicType = ['undefined', 'number', 'string', 'boolean', 'function', 'bigint', 'symbol', 'Null']

  let type = getType(copyTarget)

  if (basicType.includes(type)) {
    return target
  }

  let res = nativeDeepClone(copyTarget)

  if (res) {
    map.set(target, res)

    return res
  }

  if (copyMethodMap[type]) {
    res = copyMethodMap[type](target, map, _deepClone)

    return res
  }

  return copyTarget
}

/**
 * 优先使用 structuredClone 的深拷贝方法
 * 不支持 拷贝 prototype、function、DOM nodes、proxy(getter、setter)
 * 如果是 vue 的 ref 或者 reactive，会尝试拿到 raw value 然后进行深拷贝
 * @param {*} target value to be deep clone
 * @returns * deepCloned target
 */
export function deepClone(target) {
  return _deepClone(target, new WeakMap())
}
