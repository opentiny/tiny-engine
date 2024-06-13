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

export const getStyleValue = (value) => {
  if (typeof value === 'number' || /^\d+\.?\d*$/.test(value)) {
    return `${value}px`
  }

  if (/^\d+\.?\d*(px|%|pt|em|rem|vw|vh)$/.test(value)) {
    return value
  }

  return ''
}

export const alignMap = {
  'flex-start': 'flex-start',
  'flex-end': 'flex-end',
  center: 'center',
  stretch: 'stretch',
  start: 'start',
  end: 'end'
}

export const justAlignMap = {
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
  'flex-start': 'flex-start',
  'flex-end': 'flex-end',
  stretch: 'stretch',
  center: 'center',
  start: 'start',
  end: 'end',
  left: 'left',
  right: 'right'
}
