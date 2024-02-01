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

import { toRaw } from 'vue'
import { getGlobalConfig } from './src/globalConfig'

/**
 * 将画布pageSchema对象转换成编辑器中的string
 *
 * @param {*} obj
 * @returns
 */
export const obj2String = (obj) => {
  let out = null

  try {
    out = JSON.stringify(toRaw(obj), null, 2)
  } catch (error) {
    // do nothing
  }

  return out
}

/**
 * 将编辑器中的string转换成画布识别的pageSchema对象
 * @param {*} string
 * @returns
 */

export const string2Obj = (string) => {
  let obj = null

  try {
    obj = JSON.parse(string)
  } catch (error) {
    // do nothing
  }

  return obj
}

/**
 * 判断 Monaco 编辑器背景色的主题
 * @returns
 */

export const theme = () => {
  const theme = getGlobalConfig()?.theme?.includes('dark') ? 'vs-dark' : 'vs'

  return theme
}
