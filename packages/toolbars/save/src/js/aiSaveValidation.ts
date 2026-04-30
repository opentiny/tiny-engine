/**
 * 保存页面时的验证逻辑
 * 检查是否有未完成的AI修改，如果有则提示用户
 */

import { useCanvas, useMessage } from '@opentiny/tiny-engine-meta-register'
const { publish } = useMessage()

/**
 * 获取所有有待处理AI修改的节点ID
 */
const getAllNodesWithPendingAIModification = (): string[] => {
  const { pageState, getNode } = useCanvas()
  const pendingNodes: string[] = []

  Object.entries(pageState.aiNodesStatus).forEach(([nodeId, status]) => {
    // 只统计仍存在于schema中的节点，已删除节点不再阻塞保存
    if (status?.state === 'confirm' && getNode(nodeId)) {
      pendingNodes.push(nodeId)
    }
  })

  return pendingNodes
}

/**
 * 检查页面是否有任何待处理的AI修改
 */
const hasAnyPendingAIModification = (): boolean => {
  return getAllNodesWithPendingAIModification().length > 0
}

/**
 * 检查是否可以保存页面
 * @returns { canSave: boolean, pendingNodes: Array<{nodeId: string, description: string}> }
 */
const validateBeforeSave = () => {
  if (!hasAnyPendingAIModification()) {
    return {
      canSave: true,
      pendingNodes: []
    }
  }

  const pendingNodeIds = getAllNodesWithPendingAIModification()
  const pendingNodes = pendingNodeIds.map((nodeId) => {
    const { pageState } = useCanvas()
    const aiStatus = pageState.aiNodesStatus[nodeId] || null
    return {
      nodeId,
      aiStatus
    }
  })

  return {
    canSave: false,
    pendingNodes,
    message: `有 ${pendingNodes.length} 个节点的AI修改未完成处理`
  }
}

/**
 * 显示保存前验证对话框
 * @returns Promise<boolean> 用户是否继续保存
 */
const showSaveValidationDialog = async (): Promise<boolean> => {
  const validation = validateBeforeSave()

  if (validation.canSave) {
    return true
  }

  // 发布消息，让其他组件可以显示提示
  publish({
    topic: 'saveValidationFailed',
    data: {
      reason: 'pending_ai_modifications',
      pendingNodes: validation.pendingNodes,
      message: `请先完成以下 ${validation.pendingNodes.length} 个节点的AI修改选择：`
    }
  })
  return false
}

/**
 * 获取未完成AI修改的节点信息（用于在UI中显示）
 */
const getPendingAIModificationsInfo = () => {
  const validation = validateBeforeSave()

  if (validation.canSave) {
    return {
      hasPending: false,
      count: 0,
      nodes: []
    }
  }

  return {
    hasPending: true,
    count: validation.pendingNodes.length,
    nodes: validation.pendingNodes,
    summary: `有 ${validation.pendingNodes.length} 个节点的AI修改等待处理`
  }
}

/**
 * 快速采纳所有待处理的AI修改
 * @returns { success: boolean, adoptedCount: number }
 */
const adoptAllPendingModifications = () => {
  const pendingNodeIds = getAllNodesWithPendingAIModification()
  let adoptedCount = 0

  pendingNodeIds.forEach((nodeId) => {
    const { adoptNodeAIModification } = useCanvas()
    if (adoptNodeAIModification(nodeId)) {
      adoptedCount++
    }
  })

  return {
    success: adoptedCount > 0,
    adoptedCount,
    message: `已采纳 ${adoptedCount} 个节点的AI修改`
  }
}

/**
 * 快速拒绝所有待处理的AI修改
 * @returns { success: boolean, rejectedCount: number }
 */
const rejectAllPendingModifications = () => {
  const pendingNodeIds = getAllNodesWithPendingAIModification()
  let rejectedCount = 0

  pendingNodeIds.forEach((nodeId) => {
    const { rejectNodeAIModification } = useCanvas()
    if (rejectNodeAIModification(nodeId)) {
      rejectedCount++
    }
  })

  return {
    success: rejectedCount > 0,
    rejectedCount,
    message: `已拒绝 ${rejectedCount} 个节点的AI修改`
  }
}

/**
 * 集成到现有保存逻辑的示例
 */
const createSaveWithValidation = (originalSaveFunction: (...args: any[]) => any) => {
  return async (...args: any[]) => {
    // 检查是否可以保存
    const canSave = await showSaveValidationDialog()

    if (!canSave) {
      return {
        success: false,
        reason: 'pending_ai_modifications',
        message: '请先完成所有AI修改的选择'
      }
    }

    // 调用原始保存函数
    return originalSaveFunction(...args)
  }
}

export default function () {
  return {
    getAllNodesWithPendingAIModification,
    hasAnyPendingAIModification,
    validateBeforeSave,
    showSaveValidationDialog,
    getPendingAIModificationsInfo,
    rejectAllPendingModifications,
    createSaveWithValidation,
    adoptAllPendingModifications
  }
}
