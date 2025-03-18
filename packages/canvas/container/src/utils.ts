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
 * @param {*} nodeStr 节点列表的字符串
 * @return 复制的剪切板的String
 */
export const setClipboardSchema = (event, nodeStr) => {
  if (typeof nodeStr !== 'string' || !nodeStr.trim()) {
    return null
  }

  // 将 nodeStr 存储到剪贴板
  event.clipboardData.setData('text/plain', nodeStr)
  event.preventDefault()

  return nodeStr
}

const translateStringToSchema = (clipText) => {
  if (typeof clipText !== 'string' || !clipText.trim()) {
    return []
  }

  try {
    const parsedData = JSON.parse(clipText)

    // 如果是数组且每个项都有 componentName
    if (Array.isArray(parsedData) && parsedData.every((item) => item && item.componentName)) {
      return parsedData
    } else if (!Array.isArray(parsedData) && parsedData.componentName) {
      // 如果解析结果不是数组，将其转为数组
      return [parsedData]
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('剪贴板数据解析失败，转换为文本组件:', error)
  }

  // 如果 JSON 解析失败或不符合格式，默认返回一个文本组件
  return [
    {
      componentName: 'Text',
      props: {
        style: 'display: inline-block;',
        text: clipText,
        className: 'component-base-style'
      },
      children: []
    }
  ]
}

/**
 * 获得剪切板的内容，转换成schema
 * @param {*} event ClipboardEvent
 * @return 节点的schema对象
 */
export const getClipboardSchema = (event) => translateStringToSchema(event.clipboardData.getData('text/plain'))
