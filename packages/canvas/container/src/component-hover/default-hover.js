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
 * 默认的节点 hover 逻辑，与技术栈无关，主要包括以下几个步骤：
 * 1. 通过鼠标事件获取到当前点击节点树最近的带有 data-uid 的节点，通过 data-uid 获取到对应的 node 节点
 * 2. 计算节点的 rect 信息，更新到 hoverState 中。
 * 
 * 缺陷：
 * 1. 如果画布无法挂载 data-uid 属性到 DOM 节点上，那么该节点无法反查到对应的 node 节点，导致 hover 、选中等逻辑无法生效。
 */
import { NODE_TAG, NODE_UID } from '../../../common'
import { initialHoverState, clearHover as commonClearHover } from './common'

const curHoverState = ref({
  ...initialHoverState,
  rect: { ...initialHoverState.rect }
})

const clearHover = () => commonClearHover(curHoverState)

// TODO: 实现默认的 hover 逻辑
const updateHoverNode = (e) => {
  const target = e.target
  // const element = 

  const uid = target.getAttribute(NODE_UID)

  if (!uid) {
    clearHover()
    return
  }

  const node = useCanvas().getNodeById(uid)

  if (!node) {
    clearHover()
    return
  }

  const rect = target.getBoundingClientRect()

  curHoverState.value = {
    rect: {
      top: rect.top,
      height: rect.height,
      width: rect.width,
      left: rect.left
    },
    node,
    element: target,
    componentName: node.componentName
  }
}

export const useHoverNode = () => {

  return {
    curHoverState,
    updateHoverNode,
    clearHover
  }
}
