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

import { UNWRAP_QUOTES } from '../constant'
import { transformType } from './state-type'

const traverse = (current, description) => {
  if (typeof current !== 'object') return

  if (Array.isArray(current)) {
    current.forEach((prop) => traverse(prop, description))
  } else if (typeof current === 'object') {
    Object.keys(current || {}).forEach((prop) => {
      if (Object.prototype.hasOwnProperty.call(current, prop)) {
        // 解析协议中的类型
        transformType(current, prop, description)
        traverse(current[prop], description)
      }
    })
  }
}

const { start, end } = UNWRAP_QUOTES

const unwrapExpression = (slotsValue) =>
  slotsValue.replace(new RegExp(`"${start}(.*?)${end}"`, 'g'), (match, p1) =>
    p1.replace(/\\"/g, '"').replace(/\\r\\n|\\r|\\n/g, '')
  )

export { traverse, unwrapExpression }
