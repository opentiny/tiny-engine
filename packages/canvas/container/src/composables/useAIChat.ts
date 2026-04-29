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

import { utils } from '@opentiny/tiny-engine-utils'
import * as jsonpatch from 'fast-json-patch'
import {
  useCanvas,
  useMaterial,
  getMetaApi,
  META_SERVICE,
  useMessage,
  useHistory
} from '@opentiny/tiny-engine-meta-register'
import type { NodeAIStatus } from '../../../DesignCanvas/src/api/types'
import { search, fetchAssets } from '../services/agentServices'
import { getCurrent } from '../container'

const { deepClone } = utils

// ==================== AI助手状态管理 ====================

const updateNodeAIStatus = (nodeId: string, aiStatus: Partial<NodeAIStatus>) => {
  const { pageState } = useCanvas()
  const { publish } = useMessage()

  if (!pageState.nodesStatus[nodeId]) {
    pageState.nodesStatus[nodeId] = {}
  }

  if (!pageState.nodesStatus[nodeId].aiStatus) {
    pageState.nodesStatus[nodeId].aiStatus = {
      state: 'hidden', // 默认隐藏
      aiContext: null,
      lastAIAction: '',
      aiHistory: []
    }
  }

  Object.assign(pageState.nodesStatus[nodeId].aiStatus, aiStatus)

  // 发布状态更新事件
  publish({ topic: 'nodeAIStatusUpdate', data: { nodeId, aiStatus: pageState.nodesStatus[nodeId].aiStatus } })
}

const getNodeAIStatus = (nodeId: string): NodeAIStatus | null => {
  const { pageState } = useCanvas()
  return pageState.nodesStatus[nodeId]?.aiStatus || null
}

// 添加AI操作历史记录
const addNodeAIActionHistory = (nodeId: string, action: string, content: any) => {
  const currentStatus = getNodeAIStatus(nodeId)
  if (!currentStatus) {
    updateNodeAIStatus(nodeId, {
      state: 'hidden',
      aiHistory: [{ timestamp: Date.now(), action, content }]
    })
    return
  }

  const aiHistory = currentStatus.aiHistory || []
  aiHistory.push({ timestamp: Date.now(), action, content })

  updateNodeAIStatus(nodeId, {
    aiHistory,
    lastAIAction: action
  })
}

// 初始化单个节点的AI状态
const initializeNodeAIStatus = (node: object, initialStatus: Partial<NodeAIStatus> = {}) => {
  const { pageState } = useCanvas()

  if (!pageState.nodesStatus[node.id]) {
    pageState.nodesStatus[node.id] = {}
  }

  pageState.nodesStatus[node.id].aiStatus = {
    state: 'hidden',
    originalNodeData: deepClone(node),
    aiModifiedNodeData: undefined,
    aiContext: null,
    lastAIAction: '',
    aiHistory: [],
    ...initialStatus
  }
}

// 初始化所有现有节点的AI状态
const initializeAllNodesAIStatus = () => {
  const { pageState } = useCanvas()

  // 递归遍历 pageSchema 的 children 来初始化所有节点的AI状态
  const traverseNodes = (nodes: any[]) => {
    if (!nodes) return
    nodes.forEach((node) => {
      if (node.id && !pageState.nodesStatus[node.id]?.aiStatus) {
        initializeNodeAIStatus(node)
      }
      if (Array.isArray(node.children) && node.children.length) {
        traverseNodes(node.children)
      }
    })
  }

  if (pageState.pageSchema?.children) {
    traverseNodes(pageState.pageSchema.children)
  }
}

// 打开AI助手聊天界面
const openNodeAIChat = (nodeId: string, initialContent: string = '') => {
  updateNodeAIStatus(nodeId, {
    state: 'chat',
    chatContent: initialContent,
    lastAIAction: 'open_chat'
  })

  addNodeAIActionHistory(nodeId, 'open_chat', {
    timestamp: Date.now(),
    initialContent
  })
}

// 关闭AI助手
const closeNodeAIHelper = (nodeId: string) => {
  updateNodeAIStatus(nodeId, {
    state: 'hidden',
    lastAIAction: 'close'
  })

  addNodeAIActionHistory(nodeId, 'close', {
    timestamp: Date.now()
  })
}

// 确认AI助手操作（采纳）
// 逻辑：设置originalNodeData为AI修改后的schema，设置aiModifiedNodeData为空
const confirmNodeAIAction = (nodeId: string) => {
  const currentStatus = getNodeAIStatus(nodeId)
  if (!currentStatus || currentStatus.state !== 'confirm') {
    return
  }

  updateNodeAIStatus(nodeId, {
    state: 'completed',
    originalNodeData: deepClone(currentStatus.aiModifiedNodeData),
    aiModifiedNodeData: undefined,
    lastAIAction: 'confirm'
  })
}

// 取消AI助手操作
// 逻辑：设置aiModifiedNodeData为空，修改画布节点schema为originalNodeData
const cancelNodeAIAction = (nodeId: string) => {
  const currentStatus = getNodeAIStatus(nodeId)
  if (!currentStatus) {
    return
  }

  // 恢复画布节点schema为originalNodeData
  if (currentStatus.originalNodeData && currentStatus.state === 'confirm') {
    const { getNode } = useCanvas()
    const { publish } = useMessage()
    const node = getNode(nodeId)
    if (node) {
      Object.assign(node, deepClone(currentStatus.originalNodeData))
      publish({ topic: 'schemaChange', data: { nodeId } })
    }
  }

  const newState = currentStatus.chatContent ? 'chat' : 'hidden'

  updateNodeAIStatus(nodeId, {
    state: newState,
    aiModifiedNodeData: undefined,
    lastAIAction: 'cancel'
  })
}

/**
 * 设置AI修改后的节点数据（AI运行完调用）
 * @param nodeId 节点ID
 * @param aiModifiedNodeData AI修改后的节点数据
 */
const setNodeAIModifiedData = (nodeId: string, aiModifiedNodeData: any) => {
  const currentAIStatus = getNodeAIStatus(nodeId)
  if (!currentAIStatus) {
    return
  }

  updateNodeAIStatus(nodeId, {
    aiModifiedNodeData: deepClone(aiModifiedNodeData)
  })
}

/**
 * 采纳AI修改
 * 逻辑：设置originalNodeData为AI修改后的schema，设置aiModifiedNodeData为空
 * @param nodeId 节点ID
 */
const adoptNodeAIModification = (nodeId: string) => {
  const currentAIStatus = getNodeAIStatus(nodeId)
  if (!currentAIStatus || currentAIStatus.state !== 'confirm') {
    return false
  }

  updateNodeAIStatus(nodeId, {
    state: 'completed',
    originalNodeData: deepClone(currentAIStatus.aiModifiedNodeData),
    aiModifiedNodeData: undefined
  })

  return true
}

/**
 * 拒绝AI修改
 * 逻辑：设置aiModifiedNodeData为空，修改画布节点schema为originalNodeData
 * @param nodeId 节点ID
 */
const rejectNodeAIModification = (nodeId: string) => {
  const currentAIStatus = getNodeAIStatus(nodeId)
  if (!currentAIStatus || currentAIStatus.state !== 'confirm') {
    return false
  }

  // 恢复画布节点schema为originalNodeData
  if (currentAIStatus.originalNodeData) {
    const { getNode } = useCanvas()
    const { publish } = useMessage()
    const node = getNode(nodeId)
    if (node) {
      Object.assign(node, deepClone(currentAIStatus.originalNodeData))
      publish({ topic: 'schemaChange', data: { nodeId } })
    }
  }

  const newState = currentAIStatus.chatContent ? 'chat' : 'hidden'

  updateNodeAIStatus(nodeId, {
    state: newState,
    aiModifiedNodeData: undefined
  })

  return true
}

/**
 * 重置节点AI采纳状态
 * @param nodeId 节点ID
 */
const resetNodeAIAdoptionStatus = (nodeId: string) => {
  const currentAIStatus = getNodeAIStatus(nodeId)
  if (currentAIStatus) {
    updateNodeAIStatus(nodeId, {
      originalNodeData: undefined,
      aiModifiedNodeData: undefined
    })
  }
}

/**
 * 检查节点是否有待处理的AI修改
 * @param nodeId 节点ID
 */
const hasNodePendingAIModification = (nodeId: string): boolean => {
  const aiStatus = getNodeAIStatus(nodeId)
  return aiStatus?.state === 'confirm'
}

/**
 * 获取所有有待处理AI修改的节点ID
 */
const getAllNodesWithPendingAIModification = (): string[] => {
  const { pageState } = useCanvas()
  const pendingNodes: string[] = []

  Object.entries(pageState.nodesStatus).forEach(([nodeId, status]) => {
    if (status.aiStatus?.state === 'confirm') {
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

// ==================== AI助手状态函数 ====================

// 获取当前节点是否应该显示AI聊天界面
const shouldShowNodeAIChat = (nodeId: string): boolean => {
  const status = getNodeAIStatus(nodeId)
  return status?.state === 'chat'
}

// 获取当前节点是否应该显示确认弹窗
const shouldShowNodeAIConfirm = (nodeId: string): boolean => {
  const status = getNodeAIStatus(nodeId)
  return status?.state === 'confirm'
}

// 开始AI加载状态
const startNodeAILoading = (nodeId: string, loadingMessage: string = 'AI处理中...') => {
  updateNodeAIStatus(nodeId, {
    state: 'loading',
    lastAIAction: 'start_loading',
    aiContext: {
      loadingMessage,
      startTime: Date.now()
    }
  })

  addNodeAIActionHistory(nodeId, 'start_loading', {
    timestamp: Date.now(),
    loadingMessage
  })
}

// 完成AI加载，进入确认状态
const completeNodeAILoading = (nodeId: string) => {
  updateNodeAIStatus(nodeId, {
    state: 'confirm',
    lastAIAction: 'complete_loading'
  })

  addNodeAIActionHistory(nodeId, 'complete_loading', {
    timestamp: Date.now()
  })
}

// 取消AI加载
const cancelNodeAILoading = (nodeId: string) => {
  const currentStatus = getNodeAIStatus(nodeId)
  if (!currentStatus || currentStatus.state !== 'loading') {
    return
  }

  // 返回到聊天状态或隐藏状态
  const newState = currentStatus.chatContent ? 'chat' : 'hidden'

  updateNodeAIStatus(nodeId, {
    state: newState,
    aiContext: undefined,
    lastAIAction: 'cancel_loading'
  })

  addNodeAIActionHistory(nodeId, 'cancel_loading', {
    timestamp: Date.now(),
    previousState: currentStatus.state,
    loadingDuration: Date.now() - (currentStatus.aiContext?.startTime || Date.now())
  })
}

// 获取当前节点是否应该显示AI加载状态
const shouldShowNodeAILoading = (nodeId: string): boolean => {
  const status = getNodeAIStatus(nodeId)
  return status?.state === 'loading'
}

const findJsonPatchPath = (node, targetId, path = []) => {
  if (!node || typeof node !== 'object') return null

  if (node.id === targetId) {
    return '/' + path.join('/')
  }

  if (Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      const result = findJsonPatchPath(node.children[i], targetId, [...path, 'children', i])
      if (result) return result
    }
  }

  // 如果不是数组也不是目标，继续搜索其他属性
  for (const key in node) {
    if (key !== 'children' && Object.hasOwn(node, key)) {
      const value = node[key]
      if (value && typeof value === 'object') {
        const result = findJsonPatchPath(value, targetId, [...path, key])
        if (result) return result
      }
    }
  }

  return null
}

/**
 * 应用AI返回的JSON Patch到页面schema，完成画布更新
 * 逻辑：设置chatContent、设置aiModifiedNodeData为AI修改后的节点schema、修改画布节点schema为AI的schema
 * @param nodeId 当前节点ID
 * @param chatResponse AI聊天接口返回的响应对象
 * @param chatContent 用户发送的聊天消息
 * @returns 应用成功返回 true，失败返回 false
 */
const applyAIPatches = (nodeId: string, chatResponse: any, chatContent?: string): boolean => {
  if (!chatResponse) {
    return false
  }

  const { fixMethods, schemaAutoFix } = getMetaApi('engine.service.robot')
  const { getPageSchema, getNode, updatePageSchema, setSaved } = useCanvas()

  const content = chatResponse.choices[0].message.content
  const validJsonPatches = JSON.parse(content)
  const parentPath = findJsonPatchPath(getPageSchema(), nodeId)

  const newSchema = validJsonPatches.reduce((acc, patch) => {
    try {
      const fullPatch = {
        ...patch,
        path: parentPath + patch.path
      }
      return jsonpatch.applyPatch(acc, [fullPatch], false, false).newDocument
    } catch (error) {
      return acc
    }
  }, getPageSchema())

  fixMethods(newSchema.methods)
  schemaAutoFix(newSchema.children)

  // 使用 updatePageSchema 更新画布（保留 nodesStatus 不清空）
  updatePageSchema(newSchema)

  // 设置 AI 状态：chatContent、aiModifiedNodeData
  const modifiedNode = getNode(nodeId)
  const modifiedNodeData = modifiedNode ? deepClone(modifiedNode) : validJsonPatches[0].value

  updateNodeAIStatus(nodeId, {
    state: 'confirm',
    chatContent,
    aiModifiedNodeData: modifiedNodeData
  })

  setSaved(false)
  useHistory().addHistory()
  completeNodeAILoading(nodeId)
  return true
}

// ==================== AI聊天请求构建 ====================

/**
 * 构建AI聊天请求参数
 * @param content 用户输入的消息文本
 * @returns 请求参数对象
 */
const buildAIChatRequest = async (content: string) => {
  const { getRobotServiceOptions, formatComponents, getAgentSystemPrompt, getSelectedModelInfo } =
    getMetaApi('engine.service.robot')

  const currentSchema = getCurrent().schema
  const modelInfo = getSelectedModelInfo()
  let referenceContext = ''
  let imageAssets: any[] = []

  if (getRobotServiceOptions()?.enableRagContext) {
    referenceContext = await search(content)
  }
  if (getRobotServiceOptions()?.enableResourceContext) {
    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    imageAssets = await fetchAssets(appId)
  }

  const { materialState, getComponentDetail } = useMaterial()
  const components = formatComponents(materialState.components, getComponentDetail)
  const messages = [
    { role: 'system', content: getAgentSystemPrompt(components, currentSchema, referenceContext, imageAssets) },
    { role: 'user', content: [{ type: 'text', text: content }] }
  ]

  return {
    body: {
      baseUrl: modelInfo.baseUrl,
      model: modelInfo.model,
      apiKey: modelInfo.apiKey,
      messages
    },
    headers: {
      Authorization: `Bearer ${modelInfo.apiKey}`,
      'Content-Type': 'application/json'
    }
  }
}

export default function () {
  return {
    // AI助手状态管理
    updateNodeAIStatus,
    getNodeAIStatus,
    addNodeAIActionHistory,
    initializeNodeAIStatus,
    initializeAllNodesAIStatus,
    // AI助手状态机函数
    openNodeAIChat,
    closeNodeAIHelper,
    startNodeAILoading,
    completeNodeAILoading,
    cancelNodeAILoading,
    confirmNodeAIAction,
    cancelNodeAIAction,
    shouldShowNodeAIChat,
    shouldShowNodeAILoading,
    shouldShowNodeAIConfirm,
    // 节点级AI采纳状态管理
    setNodeAIModifiedData,
    adoptNodeAIModification,
    rejectNodeAIModification,
    resetNodeAIAdoptionStatus,
    hasNodePendingAIModification,
    getAllNodesWithPendingAIModification,
    hasAnyPendingAIModification,
    findJsonPatchPath,
    applyAIPatches,
    // AI聊天请求构建
    buildAIChatRequest
  }
}
