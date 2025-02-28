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
 * vue 画布的节点 hover 逻辑，主要包括以下几个步骤：
 * 1. 通过鼠标事件获取到当前点击节点树最近的带有 __vueComponent 的节点，通过 __vueComponent 获取到 vue 实例
 * 2. 通过 vue 实例获取到最近的带有 schema.id 的真正 vue 实例，通过 id 获取到对应的 node 节点
 * 3. 计算真正的 vue 实例的 rect 信息，更新到 hoverState 中。
 *
 * 对比默认的 hover 逻辑，解决了：
 * 无法挂载 data-uid 等属性到 DOM 节点上，从而导致无法通过 DOM 节点反查到对应的 node 节点的问题。（Fragment 组件、或者是设置了 inherit attr 属性为 false 的组件无法挂载额外的属性到实际的 DOM 节点）
 *
 */

import { ref } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { NODE_TAG, NODE_UID } from '../../../common'
import { canvasState, getConfigure, scrollToNode, getDocument } from '../container'
import {
  initialHoverState,
  clearHover as commonClearHover,
  getWindowRect,
  hoverNodeById as commonHoverNodeById,
  selectNodeById as commonSelectNodeById
} from './common'
import { getElementRectByInstance } from './vue-rect'

export const getClosedVueElement = (element) => {
  if (!element) {
    return element
  }

  if (element === element.ownerDocument.body) {
    return element
  }

  if (element.__vueComponent) {
    return element.__vueComponent
  }

  if (element.parentElement) {
    return getClosedVueElement(element.parentElement)
  }
}

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
  // 拿到最近的带有 __vueComponent 的vue 实例
  let instance = getClosedVueElement(e.target)

  let res = {
    ...initialHoverState,
    rect: { ...initialHoverState.rect }
  }

  const windowRect = getWindowRect()

  if (instance === e.target.ownerDocument.body || !instance) {
    res.rect = { ...windowRect }

    return res
  }

  let uid = instance?.props?.schema?.id

  if (!uid) {
    let closedVueEle = instance

    // TODO: 同步 develop 主干分支后，确认是否仍然需要  closedVueEle?.props?.schema?.id （当前没有的话选不中表格插槽里面的组件）
    while (
      closedVueEle &&
      !(
        closedVueEle?.props?.schema?.id ||
        closedVueEle?.attrs?.[NODE_UID] ||
        closedVueEle?.attrs?.[NODE_TAG] === 'RouterView'
      )
    ) {
      closedVueEle = closedVueEle.parent
    }

    if (!closedVueEle) {
      res.rect = { ...windowRect }
      return res
    }

    instance = closedVueEle
    uid = closedVueEle?.props?.schema?.id || closedVueEle?.attrs?.[NODE_UID]
  }

  const rect = getElementRectByInstance(instance)
  const node = useCanvas().getNodeById(uid)

  if (rect) {
    const { width, height, top, left } = rect
    const componentName = node?.componentName || instance.vnode.el.getAttribute(NODE_TAG) || ''
    const configure = getConfigure(componentName)

    return {
      rect: { width, height, top, left },
      node,
      configure,
      element: instance.vnode.el,
      componentName,
      // 无法根据 id 获取到 node（非当前页编辑的 schema），说明是非激活节点
      isInactiveNode: !node
    }
  }
}

export const updateHoverNode = (e) => {
  const res = getRectAndNode(e)

  if (!res || (res?.node?.id && res?.node?.id === selectState.value?.node?.id)) {
    clearHover()
    return
  }

  curHoverState.value = res
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

const hoverNodeById = (id) => {
  commonHoverNodeById(id, updateHoverNode)
}

const updateSelectedNode = async (e, type) => {
  let res = getRectAndNode(e)

  if (!res) {
    clearSelect()
    return
  }

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

  canvasState.emit('selected', node, parent, type, node?.id)
}

const selectNodeById = (id, type) => {
  commonSelectNodeById(updateSelectedNode, id, type)
}

export const useHoverNode = () => {
  return {
    curHoverState,
    updateHoverNode,
    clearHover,
    hoverNodeById
  }
}

const updateSelectedRect = () => {
  setTimeout(() => {
    // 当前没有选中的节点，或者当前选中的节点是 body, 不需要更新
    if (!selectState.value.node) {
      return
    }

    const res = getRectAndNode({ target: selectState.value.element })

    if (res) {
      selectState.value = res
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
