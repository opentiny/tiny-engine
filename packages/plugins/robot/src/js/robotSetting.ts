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

/* metaService: engine.plugins.robot.js-robotSetting */
import { reactive } from 'vue'
import { getOptions, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import meta from '../../meta'

export const EXISTING_MODELS = 'existingModels'
export const CUSTOMIZE = 'customize'
export const VISUAL_MODEL = ['qwen-vl-max', 'qwen-vl-plus']
export const TALK_TYPE = 'talk'
export const MCP_TYPE = 'mcp'
export const BUILD_TYPE = 'build'

export const AIModelOptions = [
  {
    label: '阿里云百炼',
    value: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: [
      { label: 'qwen-vl-max', value: 'qwen-vl-max', maxTokens: 32000 },
      { label: 'qwen-vl-plus', value: 'qwen-vl-plus', maxTokens: 32000 },
      { label: 'qwen-plus', value: 'qwen-plus', maxTokens: 131072 },
      { label: 'qwen-max', value: 'qwen-max', maxTokens: 32768 },
      { label: 'qwen-turbo', value: 'qwen-turbo', maxTokens: 1000000 },
      { label: 'qwen-long', value: 'qwen-long', maxTokens: 1000000 },
      { label: 'deepseek-r1', value: 'deepseek-r1', maxTokens: 65792 },
      { label: 'deepseek-v3', value: 'deepseek-v3', maxTokens: 65792 }
    ]
  },
  {
    label: 'DeepSeek',
    value: 'https://api.deepseek.com/v1',
    model: [
      { label: 'deepseek-chat', value: 'deepseek-chat', maxTokens: 64000 },
      { label: 'deepseek-reasoner', value: 'deepseek-reasoner', maxTokens: 64000 }
    ]
  },
  {
    label: '月之暗面',
    value: 'https://api.moonshot.cn/v1',
    model: [
      { label: 'moonshot-v1-8k', value: 'moonshot-v1-8k', maxTokens: 8192 },
      { label: 'moonshot-v1-32k', value: 'moonshot-v1-32k', maxTokens: 32768 },
      { label: 'moonshot-v1-128k', value: 'moonshot-v1-128k', maxTokens: 131072 }
    ]
  }
]

export const getAIModelOptions = () => {
  const aiRobotOptions = getOptions(meta.id)?.customCompatibleAIModels || []
  return aiRobotOptions.length ? aiRobotOptions : AIModelOptions
}

export const defaultSelectedModel = {
  label: getAIModelOptions()[0].label,
  activeName: EXISTING_MODELS,
  baseUrl: getAIModelOptions()[0].value,
  model: getAIModelOptions()[0].model[0].value,
  maxTokens: getAIModelOptions()[0].model[0].maxTokens,
  apiKey: ''
}

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
    throw new Error('获取block列表失败', { cause: err })
  }
}

export const isValidOperation = (operation) => {
  const allowedOps = ['add', 'remove', 'replace', 'move', 'copy', 'test', '_get']

  if (typeof operation !== 'object' || operation === null) {
    return false
  }
  // 检查操作类型是否有效
  if (!operation.op || !allowedOps.includes(operation.op)) {
    return false
  }
  // 检查path字段是否存在且为字符串
  if (!operation.path || typeof operation.path !== 'string') {
    return false
  }
  // 根据操作类型检查其他必需字段
  switch (operation.op) {
    case 'add':
    case 'replace':
    case 'test':
      if (!('value' in operation)) {
        return false
      }
      break
    case 'move':
    case 'copy':
      if (!operation.from || typeof operation.from !== 'string') {
        return false
      }
      break
  }

  return true
}

export const isValidFastJsonPatch = (patch) => {
  if (Array.isArray(patch)) {
    return patch.every(isValidOperation)
  } else if (typeof patch === 'object' && patch !== null) {
    return isValidOperation(patch)
  }
  return false
}
