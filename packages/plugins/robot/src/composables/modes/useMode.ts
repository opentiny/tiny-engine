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

import useModelConfig from '../core/useConfig'
import useAgentMode from './useAgentMode'
import useChatMode from './useChatMode'
import type { ModeHooks } from '../../types/mode.types'
import { ChatMode } from '../../types/mode.types'
import { getRobotServiceOptions } from '../../utils'

/**
 * 模式注册表
 * 配置式管理所有聊天模式，便于扩展新模式
 */
const modeRegistry: Record<string, () => ModeHooks> = {
  [ChatMode.Agent]: useAgentMode,
  [ChatMode.Chat]: useChatMode
}

// 缓存模式实例，避免重复创建
const modeInstanceCache: Record<string, ModeHooks> = {}

/**
 * 获取指定模式的实例（带缓存）
 */
const getModeInstance = (chatMode: string): ModeHooks => {
  if (!modeInstanceCache[chatMode]) {
    const modeFactory = getRobotServiceOptions()?.modeImplementation?.[chatMode] || modeRegistry[chatMode]
    if (!modeFactory) {
      throw new Error(`Unknown chat mode: ${chatMode}. Available modes: ${Object.keys(modeRegistry).join(', ')}`)
    }
    modeInstanceCache[chatMode] = modeFactory()
  }
  return modeInstanceCache[chatMode]
}

/**
 * 获取当前激活的模式实例
 */
const getCurrentMode = (): ModeHooks => {
  const { getSelectedModelInfo } = useModelConfig()
  return getModeInstance(getSelectedModelInfo().config!.chatMode ?? ChatMode.Agent)
}

/**
 * 模式统一入口
 * 返回代理对象，每次调用钩子时动态获取当前模式
 * 这样可以支持运行时模式切换
 */
export default function useMode(): ModeHooks {
  return {
    // 配置方法代理
    getApiUrl: () => getCurrentMode().getApiUrl(),
    getContentType: () => getCurrentMode().getContentType(),
    getLoadingType: () => getCurrentMode().getLoadingType(),

    // 生命周期钩子代理
    onConversationStart: (...args) => getCurrentMode().onConversationStart(...args),
    onMessageSent: (...args) => getCurrentMode().onMessageSent(...args),
    onBeforeRequest: (...args) => getCurrentMode().onBeforeRequest(...args),
    onStreamStart: (...args) => getCurrentMode().onStreamStart(...args),
    onStreamData: (...args) => getCurrentMode().onStreamData(...args),
    onRequestEnd: (...args) => getCurrentMode().onRequestEnd(...args),
    onStreamTools: (...args) => getCurrentMode().onStreamTools(...args),
    onBeforeCallTool: (...args) => getCurrentMode().onBeforeCallTool(...args),
    onPostCallTool: (...args) => getCurrentMode().onPostCallTool(...args),
    onPostCallTools: (...args) => getCurrentMode().onPostCallTools(...args),
    onMessageProcessed: (...args) => getCurrentMode().onMessageProcessed(...args),
    onConversationEnd: (...args) => getCurrentMode().onConversationEnd(...args)
  }
}

// 导出类型供其他模块使用
export type { ModeHooks } from '../../types/mode.types'
