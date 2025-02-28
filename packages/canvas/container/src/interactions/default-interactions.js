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
import { nextTick, ref } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { NODE_TAG, NODE_UID, NODE_INACTIVE_UID } from '../../../common'
import { getConfigure, scrollToNode, canvasState, getDocument, querySelectById } from '../container'
import {
  initialHoverState,
  clearHover as commonClearHover,
  getClosedElementHasUid,
  getWindowRect,
  hoverNodeById as commonHoverNodeById
} from './common'

const curHoverState = ref({
  ...initialHoverState,
  rect: { ...initialHoverState.rect }
})

const selectState = ref({
  ...initialHoverState,
  rect: { ...initialHoverState.rect }
})

const clearHover = () => commonClearHover(curHoverState)

const getRectAndNode = (e) => {
  const element = getClosedElementHasUid(e.target)

  let res = {
    ...initialHoverState,
    rect: { ...initialHoverState.rect }
  }

  if (!element) {
    return res
  }

  // hover 整个页面
  if (element === element?.ownerDocument?.body) {
    res.rect = { ...getWindowRect() }

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

const updateHoverNode = (e) => {
  const res = getRectAndNode(e)

  if (!res || (res?.node?.id && res?.node?.id === selectState.value?.node?.id)) {
    clearHover()
    return
  }

  curHoverState.value = res
}

const hoverNodeById = (id) => {
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

const clearSelect = () => {
  selectState.value = {
    ...initialHoverState,
    rect: { ...initialHoverState.rect }
  }
  canvasState.current = null
  canvasState.parent = null
  // TODO: 改成事件通知
  // 临时借用 remove 事触发 currentSchema 更新
  canvasState?.emit?.('remove')
}

const updateSelectedNode = async (e, type) => {
  let res = getRectAndNode(e)

  if (!res) {
    clearSelect()
    canvasState.current = null
    canvasState.parent = null

    return
  }

  // 选中的是非当前编辑页的节点，改为选中顶层节点
  if (!res.node && res.isInactiveNode) {
    res = {
      rect: { ...getWindowRect() },
      node: null,
      configure: null,
      element: getDocument().body,
      componentName: '',
      isInactiveNode: false
    }
  }

  await scrollToNode(res.element)

  const { parent, node } = useCanvas().getNodeWithParentById(res.node?.id) || {}

  canvasState.current = node
  canvasState.parent = parent
  selectState.value = res

  // TODO: 改成事件通知
  canvasState.emit('selected', node, parent, type, node?.id)
}

const selectNodeById = async (id, type) => {
  // commonSelectNodeById(updateSelectedNode, id, type)
  const element = querySelectById(id)
  const { node, parent } = useCanvas().getNodeWithParentById(id)

  if (!element || !node) {
    clearSelect()

    return
  }

  const rect = element.getBoundingClientRect()
  const componentName = node.componentName
  const configure = getConfigure(componentName)

  canvasState.current = node
  canvasState.parent = parent
  selectState.value = {
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    },
    node,
    configure,
    element,
    componentName,
    isInactiveNode: false
  }

  // TODO: 改成事件通知
  canvasState.emit('selected', node, parent, type, node?.id)
  await nextTick()
  await scrollToNode(element)
}

const updateSelectedRect = () => {
  setTimeout(() => {
    if (!selectState.value.node) {
      return
    }

    let res = getRectAndNode({ target: selectState.value.element })

    if (res?.node) {
      selectState.value = res
      return
    }

    // 通过节点没法直接计算到 rect，可能是没法挂载 data-uid 属性，需要尝试使用 querySelectById
    if (!res?.node) {
      const element = querySelectById(selectState.value.node.id)

      if (element) {
        const rect = element.getBoundingClientRect()

        selectState.value.rect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        }
      }
    }
  }, 0)
}

export const useSelectNode = () => {
  return {
    selectState,
    updateSelectedNode,
    clearSelect,
    selectNodeById,
    updateSelectedRect
  }
}
