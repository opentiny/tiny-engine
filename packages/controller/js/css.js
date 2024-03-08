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

import * as cssTree from 'css-tree'
import { hyphenate } from '../utils'

/**
 * 传入 css 字符串，得到以选择器为 Key，css 规则为 value 的 object
 * 传入示例：.test { background-color: deepskyblue; } .test.link { background-color: deeppink; } .test-text { color: #fff; }
 * 返回示例 { ".test": "background-color:deepskyblue"; ".test-text": "color:#fff"; ".test.link": "background-color:deeppink" }
 * @param {string} styleStr css 字符串
 * @returns object { [string]: string }
 */
export const getCssObjectFromStyleStr = (styleStr) => {
  const ast = cssTree.parse(styleStr)
  const cssObject = {}

  ast.children
    .filter(({ type }) => type === 'Rule')
    .forEach((item) => {
      const matchCode = cssTree.generate(item).match(/^(.+){(.+)}$/)

      if (!matchCode) {
        return
      }

      const [_, selector, code] = matchCode

      cssObject[selector] = code
    })

  return cssObject
}

export const styleStrAddRoot = (str = '') => {
  return `:root { ${str}\n}`
}

export const obj2StyleStr = (obj = {}, addRoot = true) => {
  const list = Object.entries(obj).map(([key, value]) => (value ? `${hyphenate(key)}: ${value};` : ''))

  return addRoot ? styleStrAddRoot(list.join('\n  ')) : ` { \n ${list.join('\n  ')} \n}`
}
