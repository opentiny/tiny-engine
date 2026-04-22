/**
 * 保存页面时的验证逻辑
 * 检查是否有未完成的AI修改，如果有则提示用户
 */

import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { useMessage } from '@opentiny/tiny-engine-meta-register'

/**
 * 保存验证组合函数
 */
export function useSaveValidation() {
  const { 
    hasAnyPendingAIModification, 
    getAllNodesWithPendingAIModification,
    getNodeAIStatus
  } = useCanvas()
  
  const { publish } = useMessage()

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
    const pendingNodes = pendingNodeIds.map(nodeId => {
      const aiStatus = getNodeAIStatus(nodeId)
      return {
        nodeId,
        description: aiStatus?.modificationDescription || 'AI修改',
        time: aiStatus?.aiModificationTime || Date.now()
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
    
    // 这里应该显示一个模态对话框，让用户选择
    // 由于我们没有UI组件库的访问权限，这里使用控制台提示和消息发布
    
    console.warn('保存被阻止:', validation.message)
    console.log('待处理的节点:', validation.pendingNodes)
    
    // 发布消息，让其他组件可以显示提示
    publish({
      topic: 'saveValidationFailed',
      data: {
        reason: 'pending_ai_modifications',
        pendingNodes: validation.pendingNodes,
        message: `请先完成以下 ${validation.pendingNodes.length} 个节点的AI修改选择：`
      }
    })
    
    // 模拟用户交互：在真实应用中，这里应该显示对话框并等待用户选择
    // 为了演示，我们假设用户选择不继续保存
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
    
    pendingNodeIds.forEach(nodeId => {
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
    
    pendingNodeIds.forEach(nodeId => {
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
  const createSaveWithValidation = (originalSaveFunction: Function) => {
    return async (...args: any[]) => {
      // 检查是否可以保存
      const canSave = await showSaveValidationDialog()
      
      if (!canSave) {
        console.log('用户选择不保存，因为有待处理的AI修改')
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

  return {
    // 验证函数
    validateBeforeSave,
    showSaveValidationDialog,
    getPendingAIModificationsInfo,
    
    // 批量操作
    adoptAllPendingModifications,
    rejectAllPendingModifications,
    
    // 集成函数
    createSaveWithValidation,
    
    // 使用示例
    exampleUsage: `
      // 1. 在保存按钮点击时检查
      const handleSaveClick = async () => {
        const canSave = await showSaveValidationDialog()
        if (!canSave) return
        
        // 执行实际保存逻辑
        savePage()
      }
      
      // 2. 在保存函数中集成
      const originalSave = savePage
      const saveWithValidation = createSaveWithValidation(originalSave)
      
      // 3. 在UI中显示待处理数量
      const pendingInfo = getPendingAIModificationsInfo()
      if (pendingInfo.hasPending) {
        showNotification(\`有 \${pendingInfo.count} 个AI修改等待处理\`)
      }
    `
  }
}