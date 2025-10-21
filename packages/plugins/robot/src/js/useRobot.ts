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

/* metaService: engine.plugins.robot.useRobot */
import { reactive } from 'vue'
import { getOptions } from '@opentiny/tiny-engine-meta-register'
import meta from '../../meta'

const EXISTING_MODELS = 'existingModels'
const CUSTOMIZE = 'customize'
const CHAT_MODE = { Agent: 'agent', Chat: 'chat' }

const AIModelOptions = [
  {
    label: '阿里云百炼',
    value: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: [
      { label: 'qwen-vl-max', value: 'qwen-vl-max', ability: ['visual'] },
      { label: 'qwen-vl-plus', value: 'qwen-vl-plus', ability: ['visual'] },
      { label: 'qwen-plus', value: 'qwen-plus' },
      { label: 'qwen-max', value: 'qwen-max' },
      { label: 'qwen-turbo', value: 'qwen-turbo' },
      { label: 'qwen-long', value: 'qwen-long' },
      { label: 'deepseek-r1', value: 'deepseek-r1' },
      { label: 'deepseek-v3', value: 'deepseek-v3', ability: ['tools'] },
      { label: 'qwen2.5-14b-instruct', value: 'qwen2.5-14b-instruct' },
      { label: 'qwen2.5-7b-instruct', value: 'qwen2.5-7b-instruct' },
      { label: 'qwen2.5-coder-7b-instruct', value: 'qwen2.5-coder-7b-instruct' },
      { label: 'qwen2.5-omni', value: 'qwen2.5-omni' },
      { label: 'qwen3-14b', value: 'qwen3-14b' },
      { label: 'qwen3-8b', value: 'qwen3-8b' },
      { label: 'deepseek-r1-distill-qwen-1.5b', value: 'deepseek-r1-distill-qwen-1.5b' },
      { label: 'deepseek-r1-distill-qwen-32b', value: 'deepseek-r1-distill-qwen-32b' }
    ]
  },
  {
    label: 'DeepSeek',
    value: 'https://api.deepseek.com/v1',
    model: [
      { label: 'deepseek-chat', value: 'deepseek-chat' },
      { label: 'deepseek-reasoner', value: 'deepseek-reasoner' }
    ]
  }
]

const getAIModelOptions = () => {
  const aiRobotOptions = getOptions(meta.id)?.customCompatibleAIModels || []
  return aiRobotOptions.length ? aiRobotOptions : AIModelOptions
}

const SETTING_STORAGE_KEY = 'tiny-engine-robot-settings'

const loadRobotSettingState = () => {
  const items = localStorage.getItem(SETTING_STORAGE_KEY) || '{}'
  try {
    return JSON.parse(items)
  } catch (error) {
    return items
  }
}

const saveRobotSettingState = (state: object) => {
  const currentState = loadRobotSettingState() || {}
  const newState = { ...currentState, ...state }
  localStorage.setItem(SETTING_STORAGE_KEY, JSON.stringify(newState))
}

const { activeName, existModel, customizeModel, chatMode } = loadRobotSettingState() || {}

const storageSettingState = (activeName === EXISTING_MODELS ? existModel : customizeModel) || {}

const robotSettingState = reactive({
  selectedModel: {
    label: storageSettingState.label || getAIModelOptions()[0].label,
    activeName: activeName || EXISTING_MODELS,
    baseUrl: storageSettingState.baseUrl || getAIModelOptions()[0].value,
    model: storageSettingState.model || getAIModelOptions()[0].model[0].value,
    completeModel: storageSettingState.completeModel || getAIModelOptions()[0].model[0].value || '',
    apiKey: storageSettingState.apiKey || ''
  },
  chatMode: chatMode || CHAT_MODE.Agent
})

const isValidOperation = (operation: object) => {
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

const isValidFastJsonPatch = (patch) => {
  if (Array.isArray(patch)) {
    return patch.every(isValidOperation)
  } else if (typeof patch === 'object' && patch !== null) {
    return isValidOperation(patch)
  }
  return false
}

export default () => {
  return {
    saveRobotSettingState,
    loadRobotSettingState,
    EXISTING_MODELS,
    CUSTOMIZE,
    CHAT_MODE,
    AIModelOptions,
    getAIModelOptions,
    robotSettingState,
    isValidOperation,
    isValidFastJsonPatch
  }
}
