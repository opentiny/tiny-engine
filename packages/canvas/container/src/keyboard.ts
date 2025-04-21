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

import { useHistory, useCanvas, getMetaApi, META_APP } from '@opentiny/tiny-engine-meta-register'
import { getCurrent, insertNode, selectNode, POSITION, removeNodeById, allowInsert, getConfigure } from './container'
import { copyObject } from '../../common'
import { getClipboardSchema, setClipboardSchema } from './utils'
import { useMultiSelect } from './composables/useMultiSelect'

const KEY_S = 83
const KEY_Y = 89
const KEY_Z = 90
const KEY_RIGHT = 39
const KEY_LEFT = 37
const KEY_UP = 38
const KEY_DOWN = 40
const KEY_DEL = 46

function handlerLeft({ parent }) {
  selectNode(parent?.id)
}
function handlerRight({ schema }) {
  const id = schema.children?.[0]?.id
  if (id) {
    selectNode(id)
  }
}
function handlerUp({ index, parent }) {
  const id = (parent?.children[index - 1] || parent)?.id
  if (id) {
    selectNode(id)
  }
}
function handlerDown({ index, parent }) {
  const id = parent?.children[index + 1]?.id
  if (id) {
    selectNode(id)
  }
}

const { multiSelectedStates, clearMultiSelection } = useMultiSelect()

function handlerDelete() {
  multiSelectedStates.value.forEach(({ id: schemaId }) => {
    removeNodeById(schemaId)
  })

  clearMultiSelection()
}

const handlerArrow = (keyCode) => {
  let { schema } = getCurrent()
  const { parent } = getCurrent()
  let index = null

  if (schema) {
    index = parent.children.indexOf(schema)
  } else {
    schema = useCanvas().getSchema()
  }

  const obj = {
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

const handleClipboardCut = (event) => {
  const selectedNodes = multiSelectedStates.value.map(({ schema }) => copyObject(schema))
  const dataToCut = JSON.stringify(selectedNodes)

  if (setClipboardSchema(event, dataToCut)) {
    multiSelectedStates.value.forEach(({ id }) => {
      removeNodeById(id)
    })
  }

  clearMultiSelection()
}

const handleClipboardPaste = (event) => {
  const nodeList = getClipboardSchema(event)

  if (!nodeList.length) {
    return
  }

  const lastSelected = multiSelectedStates.value.slice(-1)[0]

  if (!lastSelected) {
    return
  }

  const { schema, parent } = lastSelected

  nodeList.forEach((node) => {
    if (node?.componentName && schema?.componentName && allowInsert(getConfigure(schema.componentName), node)) {
      insertNode({ parent, node: schema, data: node }, POSITION.IN)
    } else {
      insertNode({ parent, node: schema, data: node }, POSITION.BOTTOM)
    }
  })
}

const handleCopyEvent = (event) => {
  const selectedNodes = multiSelectedStates.value.map(({ schema }) => copyObject(schema))

  // 如果没有选中任何节点，直接返回
  if (!selectedNodes.length) {
    return
  }

  // 验证所有选中的节点是否有效（不为空）
  const isValidNodes = selectedNodes.every((node) => node && Object.keys(node).length > 0)

  if (isValidNodes) {
    const dataToCopy = JSON.stringify(selectedNodes)
    setClipboardSchema(event, dataToCopy)
  }
}

const eventFiltersMap = new WeakMap()

const handlerClipboardEvent = (event) => {
  const eventFilter = eventFiltersMap.get(event.currentTarget)
  // 如果过滤器返回 false，则阻止处理
  if (typeof eventFilter === 'function' && !eventFilter(event)) {
    return
  }

  switch (event.type) {
    case 'copy':
      handleCopyEvent(event)
      break
    case 'paste':
      handleClipboardPaste(event)
      break
    case 'cut':
      handleClipboardCut(event)
      break
    default:
      break
  }
}

const keyboardHandler = (event) => {
  const eventFilter = eventFiltersMap.get(event.currentTarget)
  // 如果过滤器返回 false，则阻止处理
  if (typeof eventFilter === 'function' && !eventFilter(event)) {
    return
  }

  // 处理 Ctrl 或 Command 键
  if (event.ctrlKey || event.metaKey) {
    handlerCtrl(event)
  } else {
    handlerArrow(event.keyCode)
  }
}

const removeHotkeyEvent = (dom) => {
  dom.removeEventListener('keydown', keyboardHandler)
  dom.removeEventListener('copy', handlerClipboardEvent)
  dom.removeEventListener('cut', handlerClipboardEvent)
  dom.removeEventListener('paste', handlerClipboardEvent)

  eventFiltersMap.delete(dom)
}

const registerHotkeyEvent = (dom, options) => {
  removeHotkeyEvent(dom)

  const { eventFilter } = options || {}

  if (typeof eventFilter === 'function') {
    eventFiltersMap.set(dom, eventFilter)
  }

  dom.addEventListener('keydown', keyboardHandler)
  dom.addEventListener('copy', handlerClipboardEvent)
  dom.addEventListener('cut', handlerClipboardEvent)
  dom.addEventListener('paste', handlerClipboardEvent)
}

export { registerHotkeyEvent, removeHotkeyEvent }
