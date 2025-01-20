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

import {
  getCurrent,
  insertNode,
  selectNode,
  POSITION,
  removeNodeById,
  allowInsert,
  getConfigure,
  clearHover,
  hoverState
} from './container'
import { useHistory, useCanvas, getMetaApi, META_APP } from '@opentiny/tiny-engine-meta-register'
import { copyObject } from '../../common'
import { getClipboardSchema, setClipboardSchema } from './utils'
import { ref } from 'vue'

const KEY_S = 83
const KEY_Y = 89
const KEY_Z = 90
const KEY_RIGHT = 39
const KEY_LEFT = 37
const KEY_UP = 38
const KEY_DOWN = 40
const KEY_DEL = 46
const KEY_CTRL = 17

//  多选节点
const multiSelectedStates = ref([])
const isCtrlPressed = ref(false)

function handlerLeft({ parent }) {
  selectNode(parent?.id)
}
function handlerRight({ schema }) {
  const id = schema.children?.[0]?.id
  id && selectNode(id)
}
function handlerUp({ index, parent }) {
  const id = (parent?.children[index - 1] || parent)?.id
  id && selectNode(id)
}
function handlerDown({ index, parent }) {
  const id = parent?.children[index + 1]?.id
  id && selectNode(id)
}
function handlerDelete({ schema }) {
  if (hoverState.id === schema.id) {
    clearHover()
  }
  removeNodeById(schema.id)
}

const handlerArrow = (keyCode) => {
  let { schema, parent } = getCurrent()
  let index = null

  if (schema) {
    index = parent.children.indexOf(schema)
  } else {
    schema = useCanvas().getSchema()
  }

  let obj = {
    [KEY_LEFT]: handlerLeft,
    [KEY_RIGHT]: handlerRight,
    [KEY_UP]: handlerUp,
    [KEY_DOWN]: handlerDown,
    [KEY_DEL]: handlerDelete
  }
  if (obj[keyCode]) {
    obj[keyCode]({ index, schema, parent })
  }
}

const handleSaveEvent = (event) => {
  const { openCommon } = getMetaApi(META_APP.Save)
  event.preventDefault()
  openCommon()
}

const handlerCtrl = (event) => {
  const keyCode = event.keyCode
  isCtrlPressed.value = true
  switch (keyCode) {
    case KEY_Y:
      useHistory().forward()
      break
    case KEY_Z:
      useHistory().back()
      break
    case KEY_S:
      handleSaveEvent(event)
      break
    default:
      break
  }
}

const handleClipboardCut = (event, schema) => {
  if (setClipboardSchema(event, copyObject(schema))) {
    removeNodeById(schema?.id)
  }
}

const handleClipboardPaste = (node, schema, parent) => {
  if (node?.componentName && schema?.componentName && allowInsert(getConfigure(schema.componentName), node)) {
    insertNode({ parent, node: schema, data: { ...node } }, POSITION.IN)
  } else {
    insertNode({ parent, node: schema, data: { ...node } }, POSITION.BOTTOM)
  }
}

const handlerClipboardEvent = (event) => {
  const { schema, parent } = getCurrent()
  const node = getClipboardSchema(event)
  switch (event.type) {
    case 'copy':
      setClipboardSchema(event, copyObject(schema))
      break
    case 'paste':
      handleClipboardPaste(node, schema, parent)
      break
    case 'cut':
      handleClipboardCut(event, schema)
      break
    default:
      break
  }
}

const keyboardHandler = (event) => {
  if (event.ctrlKey) {
    handlerCtrl(event)
  }

  handlerArrow(event.keyCode)
}

const handleKeyupEvent = (event) => {
  if (event.keyCode === KEY_CTRL) {
    isCtrlPressed.value = false
  }
}

const removeHotkeyEvent = (dom) => {
  dom.removeEventListener('keydown', keyboardHandler)
  dom.removeEventListener('keyup', handleKeyupEvent)
  dom.removeEventListener('copy', handlerClipboardEvent)
  dom.removeEventListener('cut', handlerClipboardEvent)
  dom.removeEventListener('paste', handlerClipboardEvent)
}

const registerHotkeyEvent = (dom) => {
  removeHotkeyEvent(dom)

  dom.addEventListener('keydown', keyboardHandler)
  dom.addEventListener('keyup', handleKeyupEvent)
  dom.addEventListener('copy', handlerClipboardEvent)
  dom.addEventListener('cut', handlerClipboardEvent)
  dom.addEventListener('paste', handlerClipboardEvent)
}

export { registerHotkeyEvent, removeHotkeyEvent, multiSelectedStates, isCtrlPressed }
