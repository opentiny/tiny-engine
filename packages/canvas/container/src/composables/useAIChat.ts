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
import { jsonrepair } from 'jsonrepair'
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

  if (!pageState.aiNodesStatus[nodeId]) {
    pageState.aiNodesStatus[nodeId] = {
      state: 'hidden', // 默认隐藏
      aiContext: null,
      lastAIAction: '',
      aiHistory: []
    }
  }

  Object.assign(pageState.aiNodesStatus[nodeId], aiStatus)

  // 发布状态更新事件
  publish({ topic: 'nodeAIStatusUpdate', data: { nodeId, aiStatus: pageState.aiNodesStatus[nodeId] } })
}

const getNodeAIStatus = (nodeId: string): NodeAIStatus | null => {
  const { pageState } = useCanvas()
  return pageState.aiNodesStatus[nodeId] || null
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

// 打开AI助手聊天界面
const openNodeAIChat = (nodeId: string, initialContent: string = '') => {
  updateNodeAIStatus(nodeId, {
    state: 'chat',
    collapsed: false,
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

  // 采纳后直接回到hidden，completed无对应UI，避免需要点击两次才能重新打开
  updateNodeAIStatus(nodeId, {
    state: 'hidden',
    collapsed: false,
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

  // 恢复画布节点schema为originalNodeData，同步重建nodesMap
  if (currentStatus.originalNodeData && currentStatus.state === 'confirm') {
    const { restoreNodeSubtree } = useCanvas()
    const { publish } = useMessage()
    restoreNodeSubtree(nodeId, deepClone(currentStatus.originalNodeData))
    publish({ topic: 'schemaChange', data: { nodeId } })
  }

  const newState = currentStatus.chatContent ? 'chat' : 'hidden'

  updateNodeAIStatus(nodeId, {
    state: newState,
    collapsed: false,
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

  // 恢复画布节点schema为originalNodeData，同步重建nodesMap
  if (currentAIStatus.originalNodeData) {
    const { restoreNodeSubtree } = useCanvas()
    const { publish } = useMessage()
    restoreNodeSubtree(nodeId, deepClone(currentAIStatus.originalNodeData))
    publish({ topic: 'schemaChange', data: { nodeId } })
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
// ==================== AI助手状态函数 ====================

// 获取当前节点是否应该显示AI聊天界面
const shouldShowNodeAIChat = (nodeId: string): boolean => {
  const status = getNodeAIStatus(nodeId)
  return status?.state === 'chat' && !status?.collapsed
}

// 获取当前节点是否应该显示确认弹窗
const shouldShowNodeAIConfirm = (nodeId: string): boolean => {
  const status = getNodeAIStatus(nodeId)
  return status?.state === 'confirm' && !status?.collapsed
}

// 开始AI加载状态
const startNodeAILoading = (nodeId: string, loadingMessage: string = 'AI处理中...') => {
  updateNodeAIStatus(nodeId, {
    state: 'loading',
    collapsed: false,
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
    collapsed: false,
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
    collapsed: false,
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
  return status?.state === 'loading' && !status?.collapsed
}

/**
 * 逐个解析 JSON Patch 数组中的顶级 patch 对象
 * 当整个数组因括号不匹配等原因无法解析时，通过顶层 `{"op":` 模式分割后分别解析
 * 对每个单独的对象尝试 JSON.parse → jsonrepair → 修复多余括号
 */
const parseIndividualPatches = (jsonStr: string): any[] => {
  const patches: any[] = []

  // 移除外层数组的 [ ] 包裹
  let str = jsonStr.trim()
  if (str.startsWith('[')) str = str.slice(1)
  if (str.endsWith(']')) str = str.slice(0, -1)

  // 通过顶层 {"op": 模式分割各个 patch 对象
  const segments: string[] = []
  let depth = 0
  let inString = false
  let escape = false
  let segStart = -1

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]

    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === '{') {
      if (depth === 0) segStart = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && segStart >= 0) {
        segments.push(str.slice(segStart, i + 1))
        segStart = -1
      }
    }
  }

  // 对每个 segment 尝试解析，逐步增强容错
  for (const seg of segments) {
    let patch = null
    try {
      patch = JSON.parse(seg)
    } catch {
      try {
        patch = JSON.parse(jsonrepair(seg))
      } catch {
        // 尝试修复多余的尾部 }
        // 找到最后一个合法的 } 位置（通过从后往前逐步移除多余的 }）
        let fixed = seg
        for (let trim = 0; trim < 5; trim++) {
          fixed = fixed.replace(/\}(\}*)$/, '$1') // 移除最末尾的一个 }
          try {
            patch = JSON.parse(fixed)
            break
          } catch {
            // 继续尝试
          }
        }
      }
    }
    if (patch && patch.op && patch.path) {
      patches.push(patch)
    }
  }

  return patches
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
 * 解析 AI 返回的 JSON Patch 字符串，逐步增强容错：
 * 1. 剥离 Markdown 代码块包裹
 * 2. 直接 JSON.parse
 * 3. 修复未转义换行符后再 parse
 * 4. jsonrepair 修复
 * 5. 逐个 patch 解析（跳过损坏的单个 patch）
 */
const parseJsonPatches = (content: string): any[] | null => {
  let jsonStr = content
  // 剥离 Markdown 代码块
  const codeBlockMatch = jsonStr.match(/```(?:json|schema)?([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  let patches: any[] = []
  try {
    // 策略1：直接解析
    try {
      patches = JSON.parse(jsonStr)
    } catch {
      // 策略2：修复 JSON 字符串值中未转义的换行符
      try {
        const fixedStr = jsonStr.replace(
          /"((?:[^"\\]|\\.)*)"/g,
          (match, inner) => '"' + inner.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"'
        )
        patches = JSON.parse(fixedStr)
      } catch {
        // 策略3：使用 jsonrepair 修复
        try {
          patches = JSON.parse(jsonrepair(jsonStr))
        } catch {
          // 策略4：逐个 patch 解析 — AI 常在深层嵌套的 children 中产生多余的括号，
          // 导致整个数组解析失败。逐个提取顶级 patch 对象分别解析，跳过损坏的。
          patches = parseIndividualPatches(jsonStr)
        }
      }
    }
  } catch (error) {
    return null
  }

  if (!Array.isArray(patches)) {
    patches = [patches]
  }
  return patches
}

/**
 * 辅助函数：根据路径段从对象中安全取值
 */
const getValueBySegments = (obj: any, segments: string[]): any => {
  return segments.reduce((o, key) => (o !== null ? o[key] : undefined), obj)
}

/**
 * 辅助函数：将路径段拼接为 JSON Pointer 格式（以 / 开头）
 */
const toPointer = (segments: string[]): string => '/' + segments.filter(Boolean).join('/')

/**
 * 将 JSON Patch 数组应用到页面 schema 上
 * 按操作类型分步应用：先 replace/remove，再 add，最后其他
 * add 操作会自动处理：目标数组不存在时初始化、索引越界时追加到末尾
 * @param patches JSON Patch 数组
 * @param pageSchema 当前页面 schema
 * @param parentPath 当前节点在 schema 中的路径
 * @returns 应用后的新 schema
 */
const applyPatchesToSchema = (patches: any[], pageSchema: object, parentPath: string): object => {
  // 分离操作类型
  const replacePatches = patches.filter((p) => p.op === 'replace' || p.op === 'remove')
  const addPatches = patches.filter((p) => p.op === 'add')
  const otherPatches = patches.filter((p) => p.op !== 'replace' && p.op !== 'remove' && p.op !== 'add')

  // 先应用 replace/remove 操作
  let newSchema = replacePatches.reduce((acc, patch) => {
    try {
      const fullPatch = {
        ...patch,
        path: parentPath + patch.path
      }
      return jsonpatch.applyPatch(acc, [fullPatch], false, false).newDocument
    } catch (error) {
      return acc
    }
  }, pageSchema)

  // 再应用 add 操作
  // 需要处理的情况：
  // 1. 目标数组不存在 → 先初始化空数组，再追加
  // 2. 索引超出数组长度 → 降级为追加到末尾（/-）
  // 3. 最后一段不是数字索引且目标是数组 → 追加到末尾（/-）
  newSchema = addPatches.reduce((acc, patch) => {
    try {
      const pathSegments = patch.path.split('/').filter(Boolean)
      const lastSegment = pathSegments[pathSegments.length - 1]

      if (!lastSegment) {
        return acc
      }

      const parentSegments = pathSegments.slice(0, -1)
      const fullParentSegments = (parentPath + '/' + parentSegments.join('/')).split('/').filter(Boolean)
      let parentValue = getValueBySegments(acc, fullParentSegments)
      let fixedPath = patch.path

      // 父路径对应的值不是数组但路径暗示要往数组中插入（如 /children/0），
      // 需要先初始化空数组
      if (!Array.isArray(parentValue) && /^\d+$/.test(lastSegment)) {
        const arrayPath = toPointer(parentPath.split('/').filter(Boolean).concat(parentSegments))
        try {
          const patched = jsonpatch.applyPatch(
            acc,
            [{ op: 'add', path: arrayPath, value: [] }],
            false,
            false
          ).newDocument
          acc = patched
          parentValue = getValueBySegments(acc, fullParentSegments)
        } catch {
          // 路径已存在或初始化失败，尝试继续
        }
      }

      // 根据目标数组的状态修正路径
      if (Array.isArray(parentValue)) {
        const index = Number(lastSegment)
        if (Number.isNaN(index)) {
          fixedPath = toPointer(pathSegments) + '/-'
        } else if (index >= parentValue.length) {
          fixedPath = toPointer(parentSegments) + '/-'
        }
      }

      const fullPatch = {
        ...patch,
        path: parentPath + fixedPath
      }
      return jsonpatch.applyPatch(acc, [fullPatch], false, false).newDocument
    } catch (error) {
      return acc
    }
  }, newSchema)

  // 最后应用其他操作（move, copy, test 等）
  newSchema = otherPatches.reduce((acc, patch) => {
    try {
      const fullPatch = {
        ...patch,
        path: parentPath + patch.path
      }
      return jsonpatch.applyPatch(acc, [fullPatch], false, false).newDocument
    } catch (error) {
      return acc
    }
  }, newSchema)

  return newSchema
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
  if (!chatResponse?.choices?.[0]?.message?.content) {
    return false
  }

  const { fixMethods, schemaAutoFix } = getMetaApi('engine.service.robot')
  const { getPageSchema, getNode, updatePageSchema, setSaved } = useCanvas()

  const content = chatResponse.choices[0].message.content
  const validJsonPatches = parseJsonPatches(content)
  if (!validJsonPatches) {
    return false
  }

  const parentPath = findJsonPatchPath(getPageSchema(), nodeId)
  const newSchema = applyPatchesToSchema(validJsonPatches, getPageSchema(), parentPath)

  fixMethods(newSchema.methods)
  schemaAutoFix(newSchema.children)

  // 使用 updatePageSchema 更新画布（保留 nodesStatus 不清空）
  updatePageSchema(newSchema)

  // 设置 AI 状态：chatContent、aiModifiedNodeData
  const modifiedNode = getNode(nodeId)
  const modifiedNodeData = modifiedNode ? deepClone(modifiedNode) : validJsonPatches[0]?.value

  updateNodeAIStatus(nodeId, {
    state: 'confirm',
    collapsed: false,
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
    findJsonPatchPath,
    applyAIPatches,
    // AI聊天请求构建
    buildAIChatRequest
  }
}
