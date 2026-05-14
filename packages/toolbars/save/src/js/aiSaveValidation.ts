/**
 * 保存页面时的验证逻辑
 * 检查是否有未完成的AI修改，如果有则提示用户
 */
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

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

export default function () {
  return {
    getAllNodesWithPendingAIModification,
    hasAnyPendingAIModification
  }
}
