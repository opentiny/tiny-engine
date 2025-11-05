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
import { DEFAULT_LLM_MODELS } from './const'

const EXISTING_MODELS = 'existingModels'
const CUSTOMIZE = 'customize'
const CHAT_MODE = { Agent: 'agent', Chat: 'chat' }

/**
 * 合并 AI 模型配置
 * 支持：
 * 1. 通过 _remove: true 删除整个 provider（基于 baseUrl 匹配）
 * 2. 通过在 model 中设置 _remove: true 删除特定 model
 * 3. 相同 baseUrl 的 provider 会合并其 models
 * 4. 相同 value 的 model 会被自定义配置覆盖
 * @param defaults 默认配置
 * @param customs 自定义配置
 * @returns 合并后的配置
 */
const mergeAIModelOptions = (defaults: any[], customs: any[]): any[] => {
  // 深拷贝默认配置作为基础
  const result = JSON.parse(JSON.stringify(defaults))

  customs.forEach((customProvider) => {
    // 如果标记删除整个 provider（基于 baseUrl 匹配）
    if (customProvider._remove) {
      const index = result.findIndex((p: any) => p.value === customProvider.value)
      if (index !== -1) {
        result.splice(index, 1)
      }
      return
    }

    // 查找相同 baseUrl (value 字段) 的 provider
    const existingProviderIndex = result.findIndex((p: any) => p.value === customProvider.value)

    if (existingProviderIndex !== -1) {
      // 找到相同 baseUrl 的 provider，合并 models
      const existingProvider = result[existingProviderIndex]

      customProvider.models?.forEach((customModel: any) => {
        if (customModel._remove) {
          // 移除指定的 model
          const modelIndex = existingProvider.models.findIndex((m: any) => m.value === customModel.value)
          if (modelIndex !== -1) {
            existingProvider.models.splice(modelIndex, 1)
          }
        } else {
          // 查找是否存在相同 value 的 model
          const existingModelIndex = existingProvider.models.findIndex((m: any) => m.value === customModel.value)
          if (existingModelIndex !== -1) {
            // 替换已有 model（覆盖）
            const { _remove, ...modelWithoutRemove } = customModel
            existingProvider.models[existingModelIndex] = modelWithoutRemove
          } else {
            // 添加新 model
            const { _remove, ...modelWithoutRemove } = customModel
            existingProvider.models.push(modelWithoutRemove)
          }
        }
      })

      // 更新 provider 的其他属性（如果提供了）
      if (customProvider.label) existingProvider.label = customProvider.label
      if (customProvider.provider) existingProvider.provider = customProvider.provider
    } else {
      // 添加新的 provider
      const { _remove, ...providerWithoutRemove } = customProvider
      providerWithoutRemove.models = (providerWithoutRemove.models || [])
        .filter((m: any) => !m._remove)
        .map((m: any) => {
          const { _remove, ...modelWithoutRemove } = m
          return modelWithoutRemove
        })
      result.push(providerWithoutRemove)
    }
  })

  return result
}

const getAIModelOptions = () => {
  const customAIModels = getOptions(meta.id)?.customCompatibleAIModels || []
  if (!customAIModels.length) {
    return DEFAULT_LLM_MODELS
  }
  return mergeAIModelOptions(DEFAULT_LLM_MODELS, customAIModels)
}

const getModelCapabilities = (baseUrl: string, model: string) => {
  return getAIModelOptions()
    .find((option: any) => option.baseUrl === baseUrl)
    ?.models.find((item: any) => item.value === model)?.capabilities
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
    model: storageSettingState.model || getAIModelOptions()[0].models[0].value,
    completeModel: storageSettingState.completeModel || getAIModelOptions()[0].models[0].value || '',
    apiKey: storageSettingState.apiKey || ''
  },
  chatMode: chatMode || CHAT_MODE.Agent,
  enableThinking: enableThinking || false
})

export default () => {
  return {
    saveRobotSettingState,
    loadRobotSettingState,
    EXISTING_MODELS,
    CUSTOMIZE,
    CHAT_MODE,
    getAIModelOptions,
    getModelCapabilities,
    robotSettingState
  }
}
