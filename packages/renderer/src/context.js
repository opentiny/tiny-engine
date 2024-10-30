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

import { shallowReactive } from 'vue'
import { utils } from '@opentiny/tiny-engine-utils'

export const context = shallowReactive({})

// 从大纲树控制隐藏
export const conditions = shallowReactive({})

const nodes = {}
let canvasFlag = true // 是否表现画布内特征的标志，如拖拽事件、原生事件是否触发等

export const setNode = (schema, parent) => {
  schema.id = schema.id || utils.guid()
  nodes[schema.id] = { node: schema, parent }
}

export const getNode = (id, parent) => {
  return parent ? nodes[id] : nodes[id].node
}

export const delNode = (id) => delete nodes[id]

export const clearNodes = () => {
  Object.keys(nodes).forEach(delNode)
}

export const getRoot = (id) => {
  const { parent } = getNode(id, true)

  return parent?.id ? getRoot(parent.id) : parent
}

export const setContext = (ctx, clear) => {
  clear && Object.keys(context).forEach((key) => delete context[key])
  Object.assign(context, ctx)
}

export const getContext = () => context

export const setCondition = (id, visible = false) => {
  conditions[id] = visible
}

export const getCondition = (id) => conditions[id] !== false

export const getConditions = () => conditions

export const getCanvasFlag = () => canvasFlag

export const setCanvasFlag = (flag) => {
  canvasFlag = flag
}
