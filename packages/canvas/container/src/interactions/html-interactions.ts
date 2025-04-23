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
 * 默认的节点 hover、select 逻辑， HTML 画布通用，主要包括以下几个步骤：
 * 1. 通过鼠标事件获取到当前点击节点树最近的带有 data-uid 的节点，通过 data-uid 获取到对应的 node 节点
 * 2. 计算节点的 rect 信息，更新到 hoverState 中。
 *
 * 缺陷：
 * 1. 如果画布无法挂载 data-uid 属性到 DOM 节点上，那么该节点无法反查到对应的 node 节点，导致 hover 、选中等逻辑无法生效。
 */
import { ref } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { NODE_TAG, NODE_UID, NODE_INACTIVE_UID } from '../../../common'
import { getConfigure, scrollToNode, canvasState, getDocument, querySelectById } from '../container'
import {
  initialHoverState,
  clearHover as commonClearHover,
  getClosedElementHasUid,
  getWindowRect,
  hoverNodeById as commonHoverNodeById,
  selectNodeById as commonSelectNodeById
} from './common'
import type { HoverOrSelectState } from './common'

const curHoverState = ref<HoverOrSelectState>(structuredClone(initialHoverState))
const selectState = ref<HoverOrSelectState[]>([])
const clearHover = () => commonClearHover(curHoverState)

const getRectAndNode = (e: MouseEvent): HoverOrSelectState | undefined => {
  const element = getClosedElementHasUid(e.target as Element)
  let res: HoverOrSelectState = structuredClone(initialHoverState)

  if (!element) {
    return res
  }

  // hover 整个页面
  if (element === element?.ownerDocument?.body) {
    res.rect = getWindowRect()

    return res
  }

  const uid = element.getAttribute(NODE_UID) || element.getAttribute(NODE_INACTIVE_UID)

  if (!uid) {
    return
  }

  const node = useCanvas().getNodeById(uid)
  const rect = element.getBoundingClientRect()
  const componentName = node?.componentName || element.getAttribute(NODE_TAG) || ''
  const configure = getConfigure(componentName)

  res = {
    rect: {
      top: rect.top,
      height: rect.height,
      width: rect.width,
      left: rect.left
    },
    node,
    configure,
    element,
    componentName,
    // 无法根据 id 获取到 node（非当前页编辑的 schema），说明是非激活节点
    isInactiveNode: !node
  }

  return res
}

const updateHoverNode = (e: MouseEvent) => {
  const res = getRectAndNode(e)

  if (!res || (res?.node?.id && selectState.value.some((state) => state?.node?.id === res.node.id))) {
    clearHover()
    return
  }

  curHoverState.value = res
}

const clearSelect = () => {
  selectState.value = []
  canvasState.current = null
  canvasState.parent = null
  // TODO: 改成事件通知
  // 临时借用 remove 事触发 currentSchema 更新
  canvasState?.emit?.('remove')
}

const hoverNodeById = (id: string) => {
  commonHoverNodeById(id, updateHoverNode)
}

export const useHoverNode = () => {
  return {
    curHoverState,
    updateHoverNode,
    clearHover,
    hoverNodeById
  }
}

const updateSelectedNode = async (e: MouseEvent, type: string, isMultipleSelect = false) => {
  let res = getRectAndNode(e)

  if (!res) {
    clearSelect()

    return
  }

  // 选中的是非当前编辑页的节点，改为选中顶层节点
  if (!res.node && res.isInactiveNode) {
    // 多选选中非激活节点，忽略
    if (isMultipleSelect) {
      return
    }

    res = {
      rect: getWindowRect(),
      node: null,
      configure: null,
      element: getDocument().body,
      componentName: '',
      isInactiveNode: false
    }
  }

  await scrollToNode(res.element)

  const { parent, node } = useCanvas().getNodeWithParentById(res.node?.id) || {}

  if (isMultipleSelect) {
    if (!res.node) {
      // 选中非激活节点，忽略
      return
    }

    if (selectState.value.some((state) => state?.node?.id === res.node.id)) {
      // 反选
      selectState.value = selectState.value.filter((state) => state?.node?.id !== res.node.id)
    } else {
      // 选中
      selectState.value = [...selectState.value, res]
    }
  } else {
    canvasState.current = node
    canvasState.parent = parent
    selectState.value = [res]
  }

  if (selectState.value.length === 1) {
    // TODO: 改成事件通知
    canvasState.emit('selected', node, parent, type, node?.id)
  } else {
    canvasState.emit('selected', null, null, type, null)
  }
}

const selectNodeById = async (id: string, type: string, isMultipleSelect = false) => {
  commonSelectNodeById(updateSelectedNode, id, type, isMultipleSelect)
}

const updateSelectedRect = () => {
  setTimeout(() => {
    if (!selectState.value.length) {
      return
    }

    selectState.value = selectState.value.map((stateItem) => {
      // 优先需要尝试使用 querySelectById 计算 位置
      const element = querySelectById(stateItem.node.id)

      if (element) {
        const rect = element.getBoundingClientRect()

        return {
          ...stateItem,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }
        }
      }

      const res = getRectAndNode({ target: stateItem.element } as unknown as MouseEvent)

      if (res?.node) {
        return res
      }

      return stateItem
    })
  }, 0)
}

export const useSelectNode = () => {
  return {
    selectState,
    updateSelectedNode,
    clearSelect,
    selectNodeById,
    updateSelectedRect,
    defaultSelectState: initialHoverState
  }
}
