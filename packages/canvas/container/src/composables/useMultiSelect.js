import { ref, computed, toRaw } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { NODE_TAG, NODE_UID } from '../../../common'
import { getRect, getDocument } from '../container'

const initMultiState = { id: 'body' }

// 初始化多选节点
const multiSelectedStates = ref([])

// 节点位置缓存
let nodeRectCache = new WeakMap()

// 获取带缓存的节点位置
const getCachedRect = (element) => {
  if (nodeRectCache.has(element)) {
    return nodeRectCache.get(element)
  }
  const rect = getRect(element)
  nodeRectCache.set(element, rect)
  return rect
}

export const useMultiSelect = () => {
  // 记录最后选择的节点
  const lastSelectedNode = ref(null)

  const multiStateLength = computed(() => multiSelectedStates.value.length)

  // 初始化多选节点
  const initMultiSelect = () => {
    multiSelectedStates.value = [initMultiState]
  }

  // 设置多选节点
  const setMultiSelection = (nodes) => {
    if (Array.isArray(nodes)) {
      multiSelectedStates.value = nodes
    } else if (nodes && typeof nodes === 'object') {
      multiSelectedStates.value = [nodes]
    } else {
      multiSelectedStates.value = []
    }
  }

  // 添加节点到多选列表
  const addMultiSelection = (node) => {
    if (!node || typeof node !== 'object') return

    const nodeIds = multiSelectedStates.value.map((state) => state.id)
    if (!nodeIds.includes(node.id)) {
      multiSelectedStates.value.push(node)
    }
  }

  // 处理多选节点
  const toggleMultiSelection = (selectState) => {
    const nodeId = selectState?.id
    const isExistNode = multiSelectedStates.value.map((state) => state.id).includes(nodeId)

    if (nodeId && isExistNode) {
      const exList = multiSelectedStates.value.filter((state) => state.id !== nodeId)
      setMultiSelection(exList)
    } else {
      addMultiSelection(selectState)
    }
  }

  // 获取多选节点（带缓存）
  const getMultiSelectionState = (element) => {
    if (!element) {
      return null
    }

    // 使用缓存的位置信息
    const { top, left, width, height } = getCachedRect(element)
    const nodeTag = element?.getAttribute(NODE_TAG)
    const nodeId = element?.getAttribute(NODE_UID) || 'body'

    // 获取节点信息
    const { node } = useCanvas().getNodeWithParentById(nodeId) || {}
    lastSelectedNode.value = nodeId

    return {
      id: nodeId,
      componentName: nodeTag,
      doc: getDocument(element),
      top,
      left,
      width,
      height,
      schema: toRaw(node)
    }
  }

  const clearMultiSelection = () => {
    multiSelectedStates.value = []
    lastSelectedNode.value = null
    nodeRectCache = new WeakMap() // 清空缓存
  }

  return {
    multiSelectedStates,
    multiStateLength,
    initMultiSelect,
    setMultiSelection,
    getMultiSelectionState,
    toggleMultiSelection,
    clearMultiSelection
  }
}
