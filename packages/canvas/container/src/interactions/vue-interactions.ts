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
import { canvasState, getConfigure, scrollToNode, getDocument, querySelectById } from '../container'
import {
  initialHoverState,
  clearHover as commonClearHover,
  getWindowRect,
  hoverNodeById as commonHoverNodeById,
  selectNodeById as commonSelectNodeById
} from './common'
import type { HoverOrSelectState, VueInstanceInternal, HTMLElementWithVue } from './common'
import { getElementRectByInstance } from './vue-rect'

export const getClosedVueElement = (element: HTMLElementWithVue | null): VueInstanceInternal | HTMLElement | null => {
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
    return getClosedVueElement(element.parentElement as HTMLElementWithVue)
  }

  return null
}

const curHoverState = ref<HoverOrSelectState>(structuredClone(initialHoverState))
const selectState = ref<HoverOrSelectState[]>([])
const clearHover = () => commonClearHover(curHoverState)

const getRectAndNode = (e: { target: HTMLElementWithVue }): HoverOrSelectState => {
  // 拿到最近的带有 __vueComponent 的vue 实例
  let instance = getClosedVueElement(e.target)
  const res: HoverOrSelectState = structuredClone(initialHoverState)
  const windowRect = getWindowRect()

  if (!instance) {
    res.rect = { ...windowRect }
    return res
  }

  if (instance instanceof HTMLElement) {
    res.rect = { ...windowRect }
    return res
  }

  let uid = instance.props?.schema?.id

  if (!uid) {
    let closedVueEle: VueInstanceInternal | undefined = instance

    while (closedVueEle && !(closedVueEle.attrs?.[NODE_UID] || closedVueEle.attrs?.[NODE_TAG] === 'RouterView')) {
      closedVueEle = closedVueEle.parent
    }

    if (!closedVueEle) {
      res.rect = { ...windowRect }
      return res
    }

    instance = closedVueEle
    uid = closedVueEle.props?.schema?.id || closedVueEle.attrs?.[NODE_UID]
  }

  const rect = getElementRectByInstance(instance)
  const node = useCanvas().getNodeById(uid || '')

  if (rect) {
    const { width, height, top, left } = rect
    const componentName = node?.componentName || (instance.vnode?.el && instance.vnode.el.getAttribute(NODE_TAG)) || ''
    const configure = getConfigure(componentName)

    return {
      rect: { width, height, top, left },
      node,
      configure,
      element: instance.vnode?.el,
      componentName,
      // 无法根据 id 获取到 node（非当前页编辑的 schema），说明是非激活节点
      isInactiveNode: !node
    }
  }

  return res
}

export const updateHoverNode = (e: MouseEvent): void => {
  const res = getRectAndNode({ target: e.target as HTMLElementWithVue })
  if (!res || (res?.node?.id && selectState.value.some((state) => state?.node?.id === res.node.id))) {
    clearHover()
    return
  }

  curHoverState.value = res
}

const clearSelect = (): void => {
  selectState.value = []

  canvasState.current = null
  canvasState.parent = null
  // TODO: 改成事件通知
  // 临时借用 remove 事触发 currentSchema 更新
  canvasState?.emit?.('remove')
}

const hoverNodeById = (id: string): void => {
  commonHoverNodeById(id, updateHoverNode)
}

const updateSelectedNode = async (e: MouseEvent, type: string, isMultipleSelect = false): Promise<void> => {
  let res = getRectAndNode({ target: e.target as HTMLElementWithVue })

  if (!res) {
    clearSelect()
    return
  }

  if (!res.node && res.isInactiveNode) {
    // 多选选中非激活节点，忽略
    if (isMultipleSelect) {
      return
    }

    // 非多选选中非激活节点，则选中整个画布
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

    if (selectState.value.some((state) => state?.node?.id === res.node?.id)) {
      // 反选
      selectState.value = selectState.value.filter((state) => state?.node?.id !== res.node?.id)
    } else {
      // 选中
      selectState.value = [...selectState.value, res]
    }

    // 多选场景，选中多个节点或者是没有选中节点，则不显示工具栏
    if (selectState.value.length !== 1) {
      canvasState.current = null
      canvasState.parent = null
    }
  } else {
    // 非多选场景
    canvasState.current = node
    canvasState.parent = parent
    selectState.value = [res]
  }

  if (selectState.value.length === 1) {
    canvasState.emit('selected', node, parent, type, node?.id)
  } else {
    canvasState.emit('selected', null, null, type, null)
  }
}

const selectNodeById = (id: string, type: string, isMultipleSelect = false): void => {
  commonSelectNodeById(updateSelectedNode, id, type, isMultipleSelect)
}

export const useHoverNode = () => {
  return {
    curHoverState,
    updateHoverNode,
    clearHover,
    hoverNodeById
  }
}

const updateSelectedRect = (): void => {
  setTimeout(() => {
    // 当前没有选中的节点，或者当前选中的节点是 body, 不需要更新
    if (!selectState.value.length) {
      return
    }

    selectState.value = selectState.value.map((state) => {
      // 这里不能直接计算原来的 element 来获取 rect，因为 element 可能已经被移除
      // 或者是 text 节点，直接更新文本，并没有更新 element。
      // 需要优先使用 querySelectById 来获取
      const target = querySelectById(state.node?.id)

      if (target) {
        return getRectAndNode({ target: target as HTMLElementWithVue })
      }

      return getRectAndNode({ target: state.element as HTMLElementWithVue })
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
