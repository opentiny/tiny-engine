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

import { reactive } from 'vue'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export const AIModelOptions = [
  { label: 'ChatGPT：gpt-3.5-turbo', value: 'gpt-3.5-turbo', manufacturer: 'openai' },
  { label: '文心一言：ERNIE-4.0-8K', value: 'ERNIE-4.0-8K', manufacturer: 'baiduai' }
]

// 这里存放的是aichat的响应式数据
const state = reactive({
  blockList: [],
  blockContent: ''
})

export const getBlocks = () => state.blockList || []

export const setBlocks = (blocks) => {
  state.blockList = blocks
}

export const getBlockContent = () => state.blockContent || ''

const transformBlockNameToElement = (label) => {
  const elementName = label.replace(/[A-Z]/g, (letter, index) => {
    return index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`
  })
  return `<${elementName}>`
}

// 拼接blockContent，在ai初始时引入区块。
const setBlockContent = (list = getBlocks()) => {
  const blockList = list.slice(0, 200) // 为了尽量避免每个请求的message内容过大，限制block的个数避免超出字节要求
  const blockMessages = blockList.map((item) => {
    const blockElementName = transformBlockNameToElement(item.label)
    return `${blockElementName}名称是${item.label}`
  })
  const content = blockMessages?.join(';')
  if (content) {
    state.blockContent = `在提问之前，我希望你记住以下自定义的前端组件：${content}。接下来我开始问出第一个问题：`
  } else {
    state.blockContent = ''
  }
}

export const initBlockList = async () => {
  if (state.blockList?.length) {
    return
  }
  const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
  try {
    const list = await getMetaApi(META_SERVICE.Http).get('/material-center/api/blocks', { params: { appId } })
    setBlocks(list)
    setBlockContent(list)
  } catch (err) {
    // 捕获错误
  }
}
