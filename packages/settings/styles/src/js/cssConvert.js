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
import { utils } from '@opentiny/tiny-engine-utils'

const { camelize } = utils

export const styleStrRemoveRoot = (str = '') =>
  typeof str === 'string'
    ? str
        ?.replace(/:root|[\r\n{}]/gi, '')
        .replace(/\s{2,}/g, ' ')
        .replace(/"/g, "'")
        .trim()
    : ''

export const styleStr2Obj = (str = '') => {
  const obj = {}
  const list = styleStrRemoveRoot(str).split(';')

  list.forEach((item) => {
    const arr = item.split(/:\s?/)
    if (arr.length === 2) {
      obj[camelize(arr[0].trim())] = arr[1].trim()
    }
  })

  return obj
}
