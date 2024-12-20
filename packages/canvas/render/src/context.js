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

export const context = shallowReactive({})

// 从大纲树控制隐藏
export const conditions = shallowReactive({})

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

export const DESIGN_MODE = {
  DESIGN: 'design', // 设计态
  RUNTIME: 'runtime' // 运行态
}

// 是否表现画布内特征的标志，用来控制是否允许拖拽、原生事件是否触发等
let designMode = DESIGN_MODE.DESIGN

export const getDesignMode = () => designMode

export const setDesignMode = (mode) => {
  designMode = mode
}
