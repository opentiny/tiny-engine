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

/**
 * 复制节点的schema对象到剪切板，以String形式保存
 * @param {*} event ClipboardEvent
 * @param {*} node 节点的schema对象
 * @return 复制的剪切板的String
 */
export const setClipboardSchema = (event, node) => {
  let text

  if (typeof node === 'object') {
    text = JSON.stringify(node)
  } else {
    text = String(node)
  }

  event.clipboardData.setData('text/plain', text)
  event.preventDefault()

  return text
}

const translateStringToSchema = (clipText) => {
  if (!clipText) {
    return null
  }

  let data

  try {
    data = JSON.parse(clipText)
    if (!data || !data.componentName) {
      data = null
    }
  } catch (error) {
    data = null
  }

  return data
}

/**
 * 获得剪切板的内容，转换成schema
 * @param {*} event ClipboardEvent
 * @return 节点的schema对象
 */
export const getClipboardSchema = (event) => translateStringToSchema(event.clipboardData.getData('text/plain'))
