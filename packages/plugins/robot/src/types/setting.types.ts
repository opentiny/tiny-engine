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
 * 模型配置接口
 */

export interface Capability {
  extraBody: {
    enable: Record<string, unknown> | null
    disable: Record<string, unknown> | null
  }
  [key: string]: any
}

export interface ModelConfig {
  name: string
  label: string
  capabilities?: {
    toolCalling?: boolean
    vision?: boolean
    reasoning?: boolean | Capability
    compact?: boolean
    jsonOutput?: boolean | Capability
  }
}

/**
 * 模型服务接口
 */
export interface ModelService {
  id: string
  provider: string
  label: string
  baseUrl: string
  apiKey: string
  allowEmptyApiKey: boolean
  isBuiltIn: boolean
  models: ModelConfig[]
}

/**
 * 模型选择接口
 */
export interface ModelSelection {
  serviceId: string
  modelName: string
}

/**
 * 设置接口
 */
export interface RobotSettings {
  version?: number
  defaultModel: ModelSelection
  quickModel: ModelSelection
  services: ModelService[]
  chatMode: string
  enableThinking: boolean
}

export type SelectedModelInfo = ModelConfig & {
  service: Omit<ModelService, 'models'> | null

  // 配置相关
  config?: {
    chatMode: string
    enableThinking: boolean
  }

  // 模型兼容字段
  model?: string
  completeModel?: string
  // 服务兼容字段
  baseUrl?: string
  apiKey?: string
}
