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
import { NODE_TAG, NODE_UID } from '../../../common'
import { getConfigure } from '../container'
import { initialHoverState, clearHover as commonClearHover, getClosedElementHasUid, getWindowRect, hoverNodeById as commonHoverNodeById } from './common'

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
  const res = {
    ...initialHoverState,
    rect: { ...initialHoverState.rect }
  }

  // hover 整个页面
  if (element === element.ownerDocument.body) {
    res.rect = { ...getWindowRect() }

    return res
  }

  const uid = element.getAttribute(NODE_UID)

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

const updateSelectedNode = (e) => {
  const res = getRectAndNode(e)

  if (!res) {
    clearSelect()
    return
  }

  selectState.value = res
}

export const useSelectNode = () => {

  return {
    selectState,
    updateSelectedNode,
    clearSelect
  }
}
