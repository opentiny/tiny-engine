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

import { isObject, isArray } from '@opentiny/vue-renderless/grid/static'

export const MATERIAL_TYPE = {
  Component: 'component',
  Block: 'block'
}

export const NODE_INSERT_TYPE = {
  Inside: 'inside',
  After: 'after',
  Before: 'before',
  Replace: 'replace'
}

export const PROP_DATA_TYPE = {
  I18N: 'i18n',
  VARIABLE: 'variable',
  JSEXPRESSION: 'JSExpression',
  JSRESOURCE: 'JSResource',
  JSSLOT: 'JSSlot'
}

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

const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str) => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})

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

export const generateFunction = (body, context) => {
  const Func = Function
  try {
    return new Func(`return ${body}`).call(context).bind(context)
  } catch (error) {
    // do nothing
  }
  return undefined
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
