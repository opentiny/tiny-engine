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

import { UNWRAP_QUOTES, JS_EXPRESSION, JS_FUNCTION, JS_I18N, JS_RESOURCE, JS_SLOT } from '../constant'
import { getFunctionInfo, hasAccessor, addAccessorRecord } from '../utils'
import { preProcess } from '../pre-processor'
import { generateJSXTemplate } from './jsx-slot'

const { start, end } = UNWRAP_QUOTES

export const strategy = {
  [JS_EXPRESSION]: ({ value, computed }) => {
    if (computed) {
      return `${start}vue.computed(${value.replace(/this\./g, '')})${end}`
    }

    return `${start}${value.replace(/this\./g, '')}${end}`
  },

  [JS_FUNCTION]: ({ value }) => {
    const { type, params, body } = getFunctionInfo(value)
    const inlineFunc = `${type} (${params.join(',')}) => { ${body.replace(/this\./g, '')} }`

    return `${start}${inlineFunc}${end}`
  },

  [JS_I18N]: ({ key }) => `${start}t("${key}")${end}`,

  [JS_RESOURCE]: ({ value }, description) => {
    const resourceType = value.split('.')[1]

    if (Object.prototype.hasOwnProperty.call(description.jsResource, resourceType)) {
      description.jsResource[resourceType] = true
    }

    return `${start}${value.replace(/this\./g, '')}${end}`
  },

  [JS_SLOT]: ({ value = [], params = ['row'] }, description) => {
    description.hasJSX = true

    // 处理协议中的特殊情况，如：Icon 协议转换、Collection 使用 div 渲染
    value.forEach(preProcess)
    const slotValues = value.map((item) => generateJSXTemplate(item, description)).join('')

    // 默认解构参数 row，因为jsx slot 必须有第二个参数 h
    return `${start}({ ${params.join(',')} }, h) => ${slotValues}${end}`
  }
}

/**
 * 对协议中的类型做特殊处理，相应转换为字符串
 * @param {*} current 原始对象
 * @param {*} prop 当前对象的属性字段
 * @param {*} description 记录使用到的外部资源
 */
const transformType = (current, prop, description) => {
  const builtInTypes = [JS_EXPRESSION, JS_FUNCTION, JS_I18N, JS_RESOURCE, JS_SLOT]
  const { type, accessor, defaultValue } = current[prop] || {}

  if (builtInTypes.includes(type)) {
    description.internalTypes.add(type)
    current[prop] = strategy[type](current[prop], description)
  }

  // TODO: 这个是什么场景？
  if (hasAccessor(accessor)) {
    current[prop] = defaultValue

    addAccessorRecord(accessor, description.stateAccessor)
  }
}

export { transformType }
