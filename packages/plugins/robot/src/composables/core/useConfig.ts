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
import { reactive, readonly } from 'vue'
import { DEFAULT_LLM_MODELS } from '../../constants'
import { formatComponents, getAgentSystemPrompt, getJsonFixPrompt } from '../../constants/prompts'
import {
  isValidJsonPatchObjectString,
  getRobotServiceOptions,
  addSystemPrompt,
  jsonPatchAutoFix,
  isValidFastJsonPatch,
  getJsonObjectString,
  fixMethods,
  schemaAutoFix
} from '../../utils'
import { ChatMode } from '../../types/mode.types'
import type { ModelConfig, ModelService, RobotSettings, SelectedModelInfo } from '../../types/setting.types'
import apiService from '../../services/api'
import { updatePageSchema } from '../core/pageUpdater'

const SETTING_STORAGE_KEY = 'tiny-engine-robot-settings'
const SETTING_VERSION = 2 // 新版本号

const robotSettingState = reactive<RobotSettings>({
  version: SETTING_VERSION,
  defaultModel: {
    serviceId: '',
    modelName: ''
  },
  quickModel: {
    serviceId: '',
    modelName: ''
  },
  services: [],
  chatMode: ChatMode.Agent,
  enableThinking: false
})

const getAIModelOptions = () => {
  const customAIModels = getRobotServiceOptions()?.customCompatibleAIModels || []
  if (!customAIModels.length) {
    return DEFAULT_LLM_MODELS
  }
  return mergeAIModelOptions(DEFAULT_LLM_MODELS, customAIModels) // eslint-disable-line
}

// 初始化内置服务
const initBuiltInServices = (): ModelService[] => {
  return getAIModelOptions().map((service: any) => ({
    id: service.provider,
    provider: service.provider,
    label: service.label,
    baseUrl: service.baseUrl,
    apiKey: '',
    allowEmptyApiKey: service.allowEmptyApiKey ?? false,
    isBuiltIn: true,
    models: service.models
  }))
}

// 初始化默认配置
const initDefaultSettings = (): RobotSettings => {
  const builtInServices = initBuiltInServices()
  const firstService = builtInServices[0]
  const firstModel = firstService?.models[0]

  return {
    version: SETTING_VERSION,
    defaultModel: {
      serviceId: firstService?.id || '',
      modelName: firstModel?.name || ''
    },
    quickModel: {
      serviceId: '',
      modelName: ''
    },
    services: builtInServices,
    chatMode: ChatMode.Agent,
    enableThinking: false
  }
}

// 数据迁移：从旧版本格式迁移到新版本
const migrateOldSettings = (oldSettings: any): RobotSettings | null => {
  if (!oldSettings || oldSettings.version === SETTING_VERSION) {
    return null
  }

  const { activeName, existModel, customizeModel, chatMode, enableThinking } = oldSettings
  const builtInServices = initBuiltInServices()
  const services: ModelService[] = [...builtInServices]

  // 迁移旧的配置到services中
  if (activeName === 'existingModels' && existModel) {
    const service = services.find((s) => s.baseUrl === existModel.baseUrl)
    if (service) {
      service.apiKey = existModel.apiKey || ''
    }
  }

  // 迁移自定义模型
  if (activeName === 'customize' && customizeModel?.baseUrl) {
    const customService: ModelService = {
      id: `custom_${Date.now()}`,
      provider: 'custom',
      label: '自定义服务',
      baseUrl: customizeModel.baseUrl,
      apiKey: customizeModel.apiKey || '',
      allowEmptyApiKey: false,
      isBuiltIn: false,
      models: [
        {
          name: customizeModel.model || 'default',
          label: customizeModel.model || '默认模型',
          capabilities: {}
        }
      ]
    }
    if (customizeModel.completeModel) {
      customService.models.push({
        name: customizeModel.completeModel,
        label: customizeModel.completeModel,
        capabilities: { compact: true }
      })
    }
    services.push(customService)
  }

  // 确定默认模型和快速模型
  const selectedModel = activeName === 'existingModels' ? existModel : customizeModel
  const defaultServiceId =
    activeName === 'existingModels' ? services.find((s) => s.baseUrl === selectedModel?.baseUrl)?.id : ''

  return {
    version: SETTING_VERSION,
    defaultModel: {
      serviceId: defaultServiceId || services[0]?.id || '',
      modelName: selectedModel?.model || services[0]?.models[0]?.name || ''
    },
    quickModel: {
      serviceId: defaultServiceId || '',
      modelName: selectedModel?.completeModel || ''
    },
    services,
    chatMode: chatMode || ChatMode.Agent,
    enableThinking: enableThinking || false
  } as RobotSettings
}

const loadRobotSettingState = (): RobotSettings | null => {
  const items = localStorage.getItem(SETTING_STORAGE_KEY)
  if (!items) {
    return null
  }
  try {
    const parsed = JSON.parse(items)
    // 如果是旧版本，进行迁移
    if (!parsed.version || parsed.version < SETTING_VERSION) {
      const migrated = migrateOldSettings(parsed)
      if (migrated) {
        saveRobotSettingState(migrated) // eslint-disable-line
        return migrated
      }
    }
    return parsed
  } catch (error) {
    return null
  }
}

const saveRobotSettingState = (state: Partial<RobotSettings>, updateState = true) => {
  if (updateState) {
    Object.assign(robotSettingState, state)
  }
  const currentState = loadRobotSettingState() || initDefaultSettings()
  const newState = { ...currentState, ...state, version: SETTING_VERSION }
  localStorage.setItem(SETTING_STORAGE_KEY, JSON.stringify(newState))
}

/**
 * 合并默认模型服务配置和用户自定义配置
 * @param defaults 默认的模型服务配置列表
 * @param customs 用户自定义的模型服务配置列表
 * @returns 合并后的模型服务配置列表
 *
 * 支持的操作：
 * 1. 删除整个服务：{ provider: 'deepseek', _remove: true }
 * 2. 修改服务属性：{ provider: 'qwen', label: '新名称', baseUrl: '新地址' }
 * 3. 删除服务中的模型：{ provider: 'qwen', models: [{ name: 'qwen3-8b', _remove: true }] }
 * 4. 添加新模型：{ provider: 'qwen', models: [{ name: 'new-model', label: '新模型' }] }
 * 5. 覆盖模型配置：{ provider: 'qwen', models: [{ name: 'qwen-plus', label: '新标签', capabilities: {...} }] }
 * 6. 添加新服务：{ provider: 'openai', label: 'OpenAI', baseUrl: '...', models: [...] }
 */
const mergeAIModelOptions = (defaults: any[], customs: any[]): any[] => {
  // 深拷贝默认配置作为基础
  const result = JSON.parse(JSON.stringify(defaults))

  customs.forEach((customProvider) => {
    // 如果标记删除整个 provider（基于 provider 名称匹配）
    if (customProvider._remove) {
      const index = result.findIndex((p: any) => p.provider === customProvider.provider)
      if (index !== -1) {
        result.splice(index, 1)
      }
      return
    }

    // 查找相同 provider 名称的服务
    const existingProviderIndex = result.findIndex((p: any) => p.provider === customProvider.provider)

    if (existingProviderIndex !== -1) {
      // 找到相同 provider 的服务，合并配置
      const existingProvider = result[existingProviderIndex]

      // 更新服务的其他属性（如果提供了）
      if (customProvider.label !== undefined) existingProvider.label = customProvider.label
      if (customProvider.baseUrl !== undefined) existingProvider.baseUrl = customProvider.baseUrl
      if (customProvider.allowEmptyApiKey !== undefined)
        existingProvider.allowEmptyApiKey = customProvider.allowEmptyApiKey

      // 合并 models
      customProvider.models?.forEach((customModel: any) => {
        if (customModel._remove) {
          // 移除指定的 model
          const modelIndex = existingProvider.models.findIndex((m: any) => m.name === customModel.name)
          if (modelIndex !== -1) {
            existingProvider.models.splice(modelIndex, 1)
          }
        } else {
          // 查找是否存在相同 name 的 model
          const existingModelIndex = existingProvider.models.findIndex((m: any) => m.name === customModel.name)
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
    } else {
      // 添加新的 provider
      const { _remove, ...providerWithoutRemove } = customProvider
      // 过滤掉标记为删除的模型
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

// 合并缓存的服务与内置的服务，解决部分场景下缓存配置中丢失了内置服务的问题
const mergeServices = (services: ModelService[] = [], builtInServices: ModelService[]): ModelService[] => {
  const cachedServiceMap = new Map(services.map((s) => [s.id, s]))
  const result: ModelService[] = []

  builtInServices.forEach((builtIn) => {
    const cached = cachedServiceMap.get(builtIn.id)
    if (cached) {
      result.push({
        ...builtIn,
        apiKey: cached.apiKey || ''
      })
      cachedServiceMap.delete(builtIn.id)
    } else {
      result.push({ ...builtIn })
    }
  })

  cachedServiceMap.forEach((service) => {
    if (!service.isBuiltIn) {
      result.push(service)
    }
  })

  return result
}

export const init = () => {
  let settingState = loadRobotSettingState()
  if (!settingState) {
    settingState = initDefaultSettings()
  } else {
    settingState.services = mergeServices(settingState.services, initBuiltInServices())
  }
  saveRobotSettingState(settingState)
}

// 根据serviceId和modelName获取模型能力
const getModelCapabilities = (serviceId: string, modelName: string) => {
  if (!serviceId || !modelName) {
    return null
  }
  const service = robotSettingState.services.find((s) => s.id === serviceId)
  return service?.models.find((m) => m.name === modelName)?.capabilities
}

// 获取所有可用模型（扁平化）
const getAllAvailableModels = () => {
  return robotSettingState.services.flatMap((service) =>
    service.models.map((model) => ({
      serviceId: service.id,
      serviceName: service.label,
      modelName: model.name,
      modelLabel: model.label,
      capabilities: model.capabilities || {},
      displayLabel: `${service.label} - ${model.label}`,
      value: `${service.id}::${model.name}`
    }))
  )
}

// 获取快速模型列表
const getCompactModels = () => {
  return getAllAvailableModels().filter((model) => model.capabilities?.compact)
}

const updateThinkingState = (value: boolean) => {
  robotSettingState.enableThinking = value
  saveRobotSettingState({ enableThinking: robotSettingState.enableThinking })
}

const updateChatModeState = (value: string) => {
  robotSettingState.chatMode = value
  saveRobotSettingState({ chatMode: robotSettingState.chatMode })
}

const encryptServiceApiKey = async (apiKey: string): Promise<string> => {
  if (!apiKey || !getRobotServiceOptions()?.encryptServiceApiKey || apiKey.startsWith('EKEY_')) return apiKey

  try {
    const { token } = await apiService.encryptKey(apiKey)
    return token
  } catch (error) {
    const logger = console
    logger.error('加密API密钥失败', error)
    return apiKey
  }
}

// 服务管理方法
const addCustomService = async (service: Omit<ModelService, 'id' | 'isBuiltIn'>) => {
  const newService: ModelService = {
    ...service,
    id: `custom_${Date.now()}`,
    isBuiltIn: false,
    apiKey: await encryptServiceApiKey(service.apiKey)
  }
  robotSettingState.services.push(newService)
  saveRobotSettingState({ services: robotSettingState.services }, false)
  return newService.id
}

const updateService = async (serviceId: string, updates: Partial<ModelService>) => {
  const index = robotSettingState.services.findIndex((s) => s.id === serviceId)
  if (index !== -1) {
    Object.assign(robotSettingState.services[index], {
      ...updates,
      ...('apiKey' in updates ? { apiKey: await encryptServiceApiKey(updates.apiKey || '') } : {})
    })
    saveRobotSettingState({ services: robotSettingState.services }, false)
  }
}

const deleteService = (serviceId: string) => {
  const index = robotSettingState.services.findIndex((s) => s.id === serviceId)
  if (index !== -1 && !robotSettingState.services[index].isBuiltIn) {
    robotSettingState.services.splice(index, 1)
    saveRobotSettingState({ services: robotSettingState.services }, false)
  }
}

const getServiceById = (serviceId: string) => {
  return robotSettingState.services.find((s) => s.id === serviceId)
}

// 获取当前选择的对话模型信息
const getSelectedModelInfo = (): SelectedModelInfo => {
  const currentService: ModelService | undefined = getServiceById(robotSettingState.defaultModel.serviceId)
  const currentModel: ModelConfig | undefined = currentService?.models.find(
    (m) => m.name === robotSettingState.defaultModel.modelName
  )
  const { name = '', label = '', capabilities = {} } = currentModel || {}

  const { models, ...service } = currentService ?? ({} as Partial<ModelService>)

  return {
    // 模型
    name,
    label,
    capabilities,
    // 服务
    service: (currentService ? service : null) as ModelService | null,

    // 配置
    config: {
      chatMode: robotSettingState.chatMode,
      enableThinking: robotSettingState.enableThinking
    },

    // 模型兼容字段
    model: robotSettingState.defaultModel.modelName,
    // 服务兼容字段
    baseUrl: currentService?.baseUrl || '',
    apiKey: currentService?.apiKey || ''
  }
}

const getSelectedQuickModelInfo = (): SelectedModelInfo => {
  const currentService: ModelService | undefined = getServiceById(robotSettingState.quickModel.serviceId)
  const currentModel: ModelConfig | undefined = currentService?.models.find(
    (m) => m.name === robotSettingState.quickModel.modelName
  )
  const { name = '', label = '', capabilities = {} } = currentModel || {}

  const { models, ...service } = currentService ?? ({} as Partial<ModelService>)

  return {
    // 模型
    name,
    label,
    capabilities,
    // 服务
    service: (currentService ? service : null) as ModelService | null,

    // 模型兼容字段
    model: robotSettingState.quickModel.modelName,
    completeModel: robotSettingState.quickModel.modelName || '',
    // 服务兼容字段
    baseUrl: currentService?.baseUrl || '',
    apiKey: currentService?.apiKey || ''
  }
}

export default () => {
  return {
    // 配置状态
    robotSettingState: readonly(robotSettingState),

    // 状态更新与数据持久化
    updateThinkingState,
    updateChatModeState,
    saveRobotSettingState,
    loadRobotSettingState,

    // 模型相关
    getAIModelOptions, // 合并后的模型配置
    getModelCapabilities,
    getAllAvailableModels,
    getCompactModels,
    getSelectedModelInfo, // 对话模型信息
    getSelectedQuickModelInfo, // 快速模型信息

    // 服务管理
    addCustomService,
    updateService,
    deleteService,
    getServiceById,

    // 公共方法
    formatComponents,
    getAgentSystemPrompt,
    getJsonFixPrompt,
    isValidJsonPatchObjectString,
    getRobotServiceOptions,
    addSystemPrompt,
    jsonPatchAutoFix,
    isValidFastJsonPatch,
    getJsonObjectString,
    fixMethods,
    schemaAutoFix,
    updatePageSchema
  }
}
