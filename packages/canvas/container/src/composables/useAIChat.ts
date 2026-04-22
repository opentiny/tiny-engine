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

import { computed } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import type { NodeAIStatus } from '../../DesignCanvas/src/api/types'

/**
 * AI助手状态管理组合函数
 */
export function useAIChat() {
  const { 
    pageState, 
    getNodeAIStatus, 
    updateNodeAIStatus, 
    addNodeAIActionHistory,
    openNodeAIChat,
    closeNodeAIHelper,
    completeNodeAIChat,
    confirmNodeAIAction,
    cancelNodeAIAction,
    shouldShowNodeAIHelper,
    shouldShowNodeAIChat,
    shouldShowNodeAIConfirm
  } = useCanvas()

  /**
   * 获取当前选中节点的AI助手状态
   */
  const currentAIStatus = computed(() => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return null
    }
    return getNodeAIStatus(currentSchema.id)
  })

  /**
   * 当前节点是否应该显示AI助手
   */
  const shouldShowAIHelper = computed(() => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return false
    }
    
    return shouldShowNodeAIHelper(currentSchema.id)
  })

  /**
   * 当前节点是否应该显示AI聊天界面
   */
  const shouldShowAIChat = computed(() => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return false
    }
    
    return shouldShowNodeAIChat(currentSchema.id)
  })

  /**
   * 当前节点是否应该显示确认弹窗
   */
  const shouldShowAIConfirm = computed(() => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return false
    }
    
    return shouldShowNodeAIConfirm(currentSchema.id)
  })

  /**
   * 打开当前节点的AI助手聊天界面
   */
  const openCurrentAIChat = (initialContent: string = '') => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    openNodeAIChat(currentSchema.id, initialContent)
  }

  /**
   * 关闭当前节点的AI助手
   */
  const closeCurrentAIHelper = () => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    closeNodeAIHelper(currentSchema.id)
  }

  /**
   * 完成当前节点的AI聊天，进入确认状态
   */
  const completeCurrentAIChat = (result: any, confirmationConfig: {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
  }) => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    completeNodeAIChat(currentSchema.id, result, confirmationConfig)
  }

  /**
   * 确认当前节点的AI操作
   */
  const confirmCurrentAIAction = () => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    confirmNodeAIAction(currentSchema.id)
  }

  /**
   * 取消当前节点的AI操作
   */
  const cancelCurrentAIAction = () => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    cancelNodeAIAction(currentSchema.id)
  }

  /**
   * 更新当前节点的AI助手状态
   */
  const updateCurrentAIStatus = (aiStatus: Partial<NodeAIStatus>) => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    updateNodeAIStatus(currentSchema.id, aiStatus)
  }

  /**
   * 添加AI助手操作历史记录
   */
  const addAIActionHistory = (action: string, content: any) => {
    const currentSchema = pageState.currentSchema
    if (!currentSchema?.id) {
      return
    }
    
    addNodeAIActionHistory(currentSchema.id, action, content)
  }

  /**
   * 获取节点的AI助手历史记录
   */
  const getNodeAIActionHistory = (nodeId: string) => {
    const status = getNodeAIStatus(nodeId)
    return status?.aiHistory || []
  }

  /**
   * 设置节点的AI上下文
   */
  const setNodeAIContext = (nodeId: string, context: any) => {
    updateNodeAIStatus(nodeId, {
      aiContext: context
    })
  }

  /**
   * 获取节点的AI上下文
   */
  const getNodeAIContext = (nodeId: string) => {
    const status = getNodeAIStatus(nodeId)
    return status?.aiContext || null
  }

  return {
    // 状态
    currentAIStatus,
    shouldShowAIHelper,
    shouldShowAIChat,
    shouldShowAIConfirm,
    
    // 操作方法
    openCurrentAIChat,
    closeCurrentAIHelper,
    completeCurrentAIChat,
    confirmCurrentAIAction,
    cancelCurrentAIAction,
    updateCurrentAIStatus,
    addAIActionHistory,
    getNodeAIActionHistory,
    setNodeAIContext,
    getNodeAIContext,
    
    // 工具函数
    getNodeAIStatus,
    updateNodeAIStatus,
    addNodeAIActionHistory,
    openNodeAIChat,
    closeNodeAIHelper,
    completeNodeAIChat,
    confirmNodeAIAction,
    cancelNodeAIAction,
    shouldShowNodeAIHelper,
    shouldShowNodeAIChat,
    shouldShowNodeAIConfirm
  }
}