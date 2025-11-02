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

const thinkingExtraBody = {
  extraBody: {
    enable: {
      enable_thinking: true,
      thinking_budget: 1000
    },
    disable: null
  }
}

const AIModelOptions = [
  {
    label: '阿里云百炼',
    provider: 'bailian',
    value: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: [
      // Agent/chat
      // 备注：千问多模态模型不支持工具调用；
      {
        label: 'Qwen 通用模型（Plus）',
        value: 'qwen-plus',
        capabilities: {
          tools: true,
          thinking: thinkingExtraBody
        }
      },
      {
        label: 'Qwen VL视觉理解模型（PLUS）',
        value: 'qwen3-vl-plus',
        capabilities: {
          visual: true,
          thinking: thinkingExtraBody
        }
      },
      {
        label: 'Qwen Coder编程模型（PLUS）',
        value: 'qwen3-coder-plus',
        capabilities: {
          tools: true,
          thinking: thinkingExtraBody
        }
      },
      {
        label: 'DeepSeek（v3.2）',
        value: 'deepseek-v3.2-exp',
        capabilities: {
          tools: true,
          thinking: thinkingExtraBody
        }
      },
      // 小参数模型
      {
        label: 'Qwen 通用模型（Flash）',
        value: 'qwen-flash',
        capabilities: {
          compact: true
        }
      },
      {
        label: 'Qwen Coder编程模型（Flash）',
        value: 'qwen3-coder-flash',
        capabilities: {
          compact: true
        }
      },
      { label: 'Qwen3（14b）', value: 'qwen3-14b', capabilities: { compact: true } },
      { label: 'Qwen3（8b）', value: 'qwen3-8b', capabilities: { compact: true } }
    ]
  },
  {
    label: 'DeepSeek',
    provider: 'deepseek',
    value: 'https://api.deepseek.com/v1',
    model: [
      {
        label: 'DeepSeek',
        value: 'deepseek-chat',
        capabilities: {
          tools: true,
          thinking: {
            extraBody: {
              enable: { model: 'deepseek-reasoner' },
              disable: { model: 'deepseek-chat' }
            }
          }
        }
      }
    ]
  }
]

const getAIModelOptions = () => {
  const aiRobotOptions = getOptions(meta.id)?.customCompatibleAIModels || []
  return aiRobotOptions.length ? aiRobotOptions : AIModelOptions
}

const getModelCapabilities = (baseUrl: string, model: string) => {
  return AIModelOptions.find((option) => option.value === baseUrl)?.model.find((item) => item.value === model)
    ?.capabilities
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

const { activeName, existModel, customizeModel, chatMode, enableThinking } = loadRobotSettingState() || {}

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
  chatMode: chatMode || CHAT_MODE.Agent,
  enableThinking: enableThinking || false
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
    getModelCapabilities,
    robotSettingState,
    isValidOperation,
    isValidFastJsonPatch
  }
}
