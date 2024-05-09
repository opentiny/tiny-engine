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

import AlgoNode from './components/container/AlgoNode.vue'
import CanvasContainer from './components/container/CanvasContainer.vue'
import Builtin from './components/builtin/builtin.json'
import RenderMain, { api as renderApi } from './components/render/RenderMain'
import { createRender } from './components/render/runner'
import {
  dragStart,
  updateRect,
  getContext,
  getNodePath,
  dragMove,
  setLocales,
  setState,
  deleteState,
  getRenderer,
  clearSelect,
  selectNode,
  hoverNode,
  insertNode,
  removeNode,
  addComponent,
  setPageCss,
  addScript,
  addStyle,
  getNode,
  getCurrent,
  setSchema,
  setUtils,
  updateUtils,
  deleteUtils,
  getSchema,
  setI18n,
  getCanvasType,
  setCanvasType,
  setProps,
  setGlobalState,
  getGlobalState,
  getDocument,
  canvasDispatch
} from './components/container/container'
import GroupNode from './components/container/GroupNode.vue';

export {
  CanvasContainer,
  RenderMain,
  renderApi,
  Builtin,
  dragStart,
  dragMove,
  updateRect,
  getContext,
  getNodePath,
  getNode,
  getCurrent,
  setSchema,
  setUtils,
  updateUtils,
  deleteUtils,
  getSchema,
  setLocales,
  setState,
  deleteState,
  setI18n,
  getRenderer,
  clearSelect,
  selectNode,
  insertNode,
  removeNode,
  hoverNode,
  addComponent,
  setPageCss,
  addScript,
  addStyle,
  getCanvasType,
  setCanvasType,
  setProps,
  setGlobalState,
  getGlobalState,
  getDocument,
  canvasDispatch,
  createRender,
  AlgoNode,
  GroupNode
}

export default CanvasContainer
