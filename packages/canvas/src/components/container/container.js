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

import { reactive, toRaw, nextTick, shallowReactive } from 'vue'
import {
  addScript as appendScript,
  addStyle as appendStyle,
  copyObject,
  NODE_UID,
  NODE_TAG,
  NODE_LOOP
} from '../common'
import { useCanvas, useLayout, useResource, useTranslate } from '@opentiny/tiny-engine-controller'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import Builtin from '../builtin/builtin.json'

export const POSITION = Object.freeze({
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  IN: 'in'
})

const initialDragState = {
  keydown: false,
  draging: false,
  data: null,
  position: null, // ghost位置
  mouse: null, // iframe里鼠标位置
  element: null,
  offset: {}
}

export const canvasState = shallowReactive({
  type: 'normal',
  schema: null,
  renderer: null, // 存放画布内的api
  iframe: null,
  loading: true,
  current: null,
  parent: null,
  loopId: null
})

export const getRenderer = () => canvasState.renderer

export const getController = () => canvasState.controller

export const getDocument = () => canvasState.iframe.contentDocument

export const getWindow = () => canvasState.iframe.contentWindow

export const getCurrent = () => {
  return {
    schema: canvasState.current,
    parent: canvasState.parent,
    loopId: canvasState.loopId
  }
}

export const getGlobalState = () => getRenderer().getGlobalState()

export const getNode = (id, parent) => getRenderer()?.getNode(id, parent)

export const getSchema = () => getRenderer()?.getSchema()

export const getContext = () => {
  return getRenderer().getContext()
}

// 记录拖拽状态
export const dragState = reactive({
  ...initialDragState
})

export const initialRectState = {
  top: 0,
  height: 0,
  width: 0,
  left: 0,
  schema: null,
  configure: null,
  componentName: ''
}

const initialLineState = {
  top: 0,
  height: 0,
  width: 0,
  left: 0,
  position: '',
  forbidden: false,
  id: '',
  config: null,
  doc: null
}

// 选中画布中元素时的状态
export const selectState = reactive({
  ...initialRectState
})

// 鼠标移入画布中元素时的状态
export const hoverState = reactive({
  ...initialRectState
})

// 拖拽时的位置状态
export const lineState = reactive({
  ...initialLineState
})

export const clearHover = () => {
  Object.assign(hoverState, initialRectState, { slot: null })
}

export const clearSelect = () => {
  canvasState.current = null
  canvasState.parent = null
  Object.assign(selectState, initialRectState)
  // 临时借用 remote 事件出发 currentSchema 更新
  canvasState?.emit?.('remove')
}

const smoothScroll = {
  timmer: null,
  /**
   *
   * @param {*} up 方向
   * @param {*} step 每次滚动距离
   * @param {*} time 滚动延时（不得大于系统滚动时长，否则可能出现卡顿效果）
   */
  start(up, step = 40, time = 100) {
    const dom = getDocument().documentElement
    const fn = () => {
      const top = up ? dom.scrollTop + step : dom.scrollTop - step

      dom.scrollTo({ top, behavior: 'smooth' })
      this.timmer = setTimeout(fn, time)
    }

    this.timmer || fn()
  },
  stop() {
    clearTimeout(this.timmer)
    this.timmer = null
  }
}

export const dragStart = (
  data,
  element,
  { offsetX = 0, offsetY = 0, horizontal, vertical, width, height, x, y } = {}
) => {
  // 表示鼠标按下开始拖拽
  dragState.keydown = true
  dragState.data = data || {}

  // 记录上次一开始拖拽的时间
  dragState.timer = Date.now()

  // 如果element存在表示在iframe内部拖拽
  dragState.element = element
  dragState.offset = { offsetX, offsetY, horizontal, vertical, width, height, x, y }
  clearHover()
}

export const clearLineState = () => {
  Object.assign(lineState, initialLineState)
}

export const dragEnd = () => {
  const { element, data } = dragState

  if (element && canvasState.type === 'absolute') {
    data.props = data.props || {}
    data.props.style = element.style.cssText
  }

  // 重置拖拽状态
  Object.assign(dragState, initialDragState)

  // 重置拖拽插入位置状态
  clearLineState()
  smoothScroll.stop()
}

export const getOffset = (element) => {
  if (element.ownerDocument === document) {
    return { x: 0, y: 0 }
  }
  const { x, y, bottom, top } = canvasState.iframe.getBoundingClientRect()
  return { x, y, bottom, top }
}

export const getElement = (element) => {
  // 如果当前元素是body
  if (element === element.ownerDocument.body) {
    return element
  }

  // 如果当前元素是画布的html，返回画布的body
  if (element === element.ownerDocument.documentElement) {
    return element.ownerDocument.body
  }

  if (!element || element.nodeType !== 1) {
    return undefined
  }

  if (element.getAttribute(NODE_UID)) {
    return element
  } else if (element.parentElement) {
    return getElement(element.parentElement)
  }

  return undefined
}

const getRect = (element) => {
  if (element === getDocument().body) {
    const { innerWidth: width, innerHeight: height } = getWindow()
    return {
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0
    }
  }
  return element.getBoundingClientRect()
}

const inserAfter = ({ parent, node, data }) => {
  const parentChildren = parent.children
  const index = parentChildren.indexOf(node)
  parent.children.splice(index + 1, 0, data)
}

const insertBefore = ({ parent, node, data }) => {
  const parentChildren = parent.children
  const index = parentChildren.indexOf(node)
  parent.children.splice(index, 0, data)
}

const insertInner = ({ node, data }, position) => {
  node.children = node.children || []

  if (position === POSITION.TOP || position === POSITION.LEFT) {
    node.children.unshift(data)
  } else {
    node.children.push(data)
  }
}

export const removeNode = ({ parent, node }) => {
  const parentChildren = parent.children || parent.value
  const index = parentChildren.indexOf(node)

  if (index > -1) {
    parentChildren.splice(index, 1)
  } else {
    const templates = parentChildren.filter(({ componentName }) => componentName === 'Template')

    templates.forEach((template) => {
      const { children } = template

      if (children.length) {
        children.splice(children.indexOf(node), 1)
      }

      if (!children.length) {
        parentChildren.splice(parentChildren.indexOf(template), 1)
      }
    })
  }
}

export const removeNodeById = (id) => {
  if (!id) {
    return
  }

  removeNode(getNode(id, true))
  clearSelect()
  getController().addHistory()
  canvasState.emit('remove')
}

export const querySelectById = (id) => {
  let selector = `[${NODE_UID}="${id}"]`
  const doc = canvasState.iframe.contentDocument
  let element = doc.querySelector(selector)
  const loopId = element?.getAttribute('loop-id')
  if (element && loopId) {
    const currentLoopId = getCurrent().loopId
    selector = `[${NODE_UID}="${id}"][${NODE_LOOP}="${currentLoopId}"]`
    element = doc.querySelector(selector)
  }
  return element
}

export const getCurrentElement = () => querySelectById(getCurrent().schema?.id)

// 滚动页面后，目标元素与页面边界至少保留的边距
const SCROLL_MARGIN = 15

export const scrollToNode = (element) => {
  if (element) {
    const container = getDocument().documentElement
    const { clientWidth, clientHeight } = container
    const { left, right, top, bottom, width, height } = element.getBoundingClientRect()
    const option = {}

    if (right < 0) {
      option.left = container.scrollLeft + left - SCROLL_MARGIN
    } else if (left > clientWidth) {
      option.left = container.scrollLeft + left - clientWidth + width + SCROLL_MARGIN
    }

    if (bottom < 0) {
      option.top = container.scrollTop + top - SCROLL_MARGIN
    } else if (top > clientHeight) {
      option.top = container.scrollTop + top - clientHeight + height + SCROLL_MARGIN
    }

    if (typeof option.left === 'number' || typeof option.top === 'number') {
      container.scrollTo(option)
    }
  }

  return nextTick()
}
const setSelectRect = (element) => {
  element = element || getDocument().body

  const { left, height, top, width } = getRect(element)
  const componentName = getCurrent().schema?.componentName || ''
  clearHover()
  Object.assign(selectState, {
    width,
    height,
    top,
    left,
    componentName,
    doc: getDocument()
  })
}

export const updateRect = (id) => {
  id = (typeof id === 'string' && id) || getCurrent().schema?.id
  clearHover()

  if (id) {
    setTimeout(() => setSelectRect(querySelectById(id)))
  } else {
    // 如果选中的是body，不清除选中框
    if (!selectState.componentName && selectState.width > 0) {
      return
    }
    clearSelect()
  }
}

export const getConfigure = (targetName) => {
  const material = getController().getMaterial(targetName)

  // 这里如果是区块插槽，则返回标识为容器的对象
  if (targetName === 'Template') {
    return {
      isContainer: true
    }
  }

  return material?.content?.configure || material.configure || {}
}

/**
 * 是否允许插入
 * @param {*} configure 当前放置目标的 configure，比如getConfigure(componentName)
 * @param {*} data 当前插入目标的schame数据
 * @returns
 */
export const allowInsert = (configure = hoverState.configure || {}, data = dragState.data || {}) => {
  const { nestingRule = {} } = configure
  const { childWhitelist = [], descendantBlacklist = [] } = nestingRule

  // 要插入的父节点必须是容器
  if (!configure.isContainer) {
    return false
  }

  let flag = true
  // 白名单
  flag = childWhitelist.length ? childWhitelist.includes(data?.componentName) : true

  // 黑名单
  if (descendantBlacklist.length) {
    flag = !descendantBlacklist.includes(data?.componentName)
  }

  return flag
}

const isAncestor = (ancestor, descendant) => {
  const ancestorId = typeof ancestor === 'string' ? ancestor : ancestor.id
  let descendantId = typeof descendant === 'string' ? descendant : descendant.id

  while (descendantId) {
    const { parent } = getNode(descendantId, true) || {}

    if (parent.id === ancestorId) {
      return true
    }

    descendantId = parent.id
  }

  return false
}

// 获取位置信息，返回状态
const lineAbs = 20
const getPosLine = (rect, configure) => {
  const mousePos = dragState.mouse
  const yAbs = Math.min(lineAbs, rect.height / 3)
  const xAbs = Math.min(lineAbs, rect.width / 3)
  let type
  let forbidden = false

  if (mousePos.y < rect.top + yAbs) {
    type = POSITION.TOP
  } else if (mousePos.y > rect.bottom - yAbs) {
    type = POSITION.BOTTOM
  } else if (mousePos.x < rect.left + xAbs) {
    type = POSITION.LEFT
  } else if (mousePos.x > rect.right - xAbs) {
    type = POSITION.RIGHT
  } else if (configure.isContainer) {
    type = POSITION.IN
    if (!allowInsert()) {
      forbidden = true
    }
  } else {
    type = POSITION.BOTTOM
  }

  // 如果被拖拽的节点不是新增的，并且是放置的节点的祖先节点，则禁止插入
  const draggedId = dragState.data?.id
  if (draggedId && isAncestor(draggedId, lineState.id)) {
    forbidden = true
  }

  return { type, forbidden }
}

const isBodyEl = (element) => element.nodeName === 'BODY'

const setHoverRect = (element, data) => {
  if (!element) {
    return clearHover()
  }
  const componentName = element.getAttribute(NODE_TAG)
  const id = element.getAttribute(NODE_UID)
  const configure = getConfigure(componentName)
  const rect = getRect(element)
  const { left, height, top, width } = rect

  hoverState.configure = configure

  if (data) {
    let childEle = null
    lineState.id = id
    lineState.configure = configure
    const rectType = isBodyEl(element) ? POSITION.IN : getPosLine(rect, configure).type

    // 如果拖拽经过的元素是body或者是带有容器属性的盒子，并且在元素内部插入,则需要特殊处理
    if ((isBodyEl(element) || configure?.isContainer) && rectType === POSITION.IN) {
      const { node } = isBodyEl(element) ? { node: getSchema() } : getNode(id, true) || {}
      const children = node?.children || []
      if (children.length > 0) {
        // 如果容器盒子有子节点，则以最后一个子节点为拖拽参照物
        const lastNode = children[children.length - 1]
        childEle = querySelectById(lastNode.id)
        const childComponentName = element.getAttribute(childEle)
        const Childconfigure = getConfigure(childComponentName)
        lineState.id = lastNode.id
        lineState.configure = Childconfigure
      }
    }

    // 如果容器盒子有子元素
    if (childEle) {
      const childRect = getRect(childEle)
      const { left, height, top, width } = childRect
      const posLine = getPosLine(childRect, lineState.configure)
      Object.assign(lineState, {
        width,
        height,
        top,
        left,
        position: canvasState.type === 'absolute' || posLine.type,
        forbidden: posLine.forbidden
      })
    } else {
      const posLine = getPosLine(rect, configure)
      Object.assign(lineState, {
        width,
        height,
        top,
        left,
        position: canvasState.type === 'absolute' || posLine.type,
        forbidden: posLine.forbidden
      })
    }

    useLayout().closePlugin()
  }

  // 设置元素hover状态
  Object.assign(hoverState, {
    width,
    height,
    top,
    left,
    componentName
  })
  return undefined
}

// 绝对布局
const absoluteMove = (event, element) => {
  const { clientX, clientY } = event
  const { offsetX, offsetY, horizontal, vertical, height, width, x, y } = dragState.offset

  element.style.position = 'absolute'

  if (!horizontal) {
    // 未传方向信息时判断为移动元素位置
    element.style.top = `${clientY - offsetY}px`
    element.style.left = `${clientX - offsetX}px`
  } else {
    // 调整元素大小
    if (horizontal === 'start') {
      element.style.left = `${clientX}px`
      element.style.width = `${width + (x - clientX)}px`
    }

    if (horizontal === 'end') {
      element.style.width = `${clientX - x}px`
    }

    if (vertical === 'start') {
      element.style.top = `${clientY}px`
      element.style.height = `${height + (y - clientY)}px`
    }

    if (vertical === 'end') {
      element.style.height = `${clientY - y}px`
    }
  }
  updateRect()
}

const setDragPosition = ({ clientX, x, clientY, y, offsetBottom, offsetTop }) => {
  const left = clientX + x
  const top = clientY + y
  if (clientY < 20) {
    smoothScroll.start(false)
  } else if (offsetBottom - clientY - offsetTop < 20) {
    smoothScroll.start(true)
  } else {
    smoothScroll.stop()
  }

  dragState.position = { left, top }
}

export const dragMove = (event, isHover) => {
  if (!dragState.draging && dragState.keydown && new Date().getTime() - dragState.timer < 200) {
    return
  }

  const { x, y, bottom: offsetBottom, top: offsetTop } = getOffset(event.target)
  const { clientX, clientY } = event
  const { element } = dragState
  const absolute = canvasState.type === 'absolute'

  dragState.draging = dragState.keydown

  dragState.mouse = { x: clientX, y: clientY }

  // 如果仅仅是mouseover事件直接return,并重置拖拽位置状态，优化性能
  if (isHover) {
    lineState.position = ''
    setHoverRect(getElement(event.target), null)

    return
  }

  setHoverRect(getElement(event.target), dragState.data)

  if (dragState.draging) {
    // 绝对布局时走的逻辑
    if (element && absolute) {
      absoluteMove(event, element)
    }
    setDragPosition({ clientX, x, clientY, y, offsetBottom, offsetTop })
  }
}

// type == clickTree, 为点击大纲; type == loop-id=xxx ,为点击循环数据
export const selectNode = async (id, type) => {
  if (type && type.indexOf('loop-id') > -1) {
    const loopId = type.split('=')[1]
    canvasState.loopId = loopId
  }
  const { node, parent } = getNode(id, true) || {}
  let element = querySelectById(id, type)

  if (element) {
    const { rootSelector } = getConfigure(node.componentName)
    element = rootSelector ? element.querySelector(rootSelector) : element
  }

  canvasState.current = node
  canvasState.parent = parent

  await scrollToNode(element)
  setSelectRect(element)
  canvasState.emit('selected', node, parent, type)

  return node
}

export const hoverNode = (id, data) => {
  const element = querySelectById(id)
  element && setHoverRect(element, data)
}

export const insertNode = (node, position = POSITION.IN, select = true) => {
  if (!node.parent) {
    insertInner({ node: canvasState.schema, data: node.data }, position)
  } else {
    switch (position) {
      case POSITION.TOP:
      case POSITION.LEFT:
        insertBefore(node)
        break
      case POSITION.BOTTOM:
      case POSITION.RIGHT:
        inserAfter(node)
        break
      case POSITION.IN:
        insertInner(node)
        break
      default:
        insertInner(node)
        break
    }
  }

  select && setTimeout(() => selectNode(node.data.id))

  getController().addHistory()
}

export const addComponent = (data, position) => {
  const { schema, parent } = getCurrent()

  insertNode({ node: schema, parent, data }, position)
}

export const copyNode = (id) => {
  if (!id) {
    return
  }
  const { node, parent } = getNode(id, true)

  inserAfter({ parent, node, data: copyObject(node) })
  getController().addHistory()
}

export const onMouseUp = () => {
  const { draging, data } = dragState
  const { position, forbidden } = lineState
  const absolute = canvasState.type === 'absolute'
  const sourceId = data?.id
  const lineId = lineState.id

  if (draging && !forbidden) {
    const { parent, node } = getNode(lineId, true) || {} // target
    const targetNode = { parent, node, data: toRaw(data) }

    if (sourceId) {
      // 内部拖拽
      if (sourceId !== lineId && !absolute) {
        removeNode(getNode(sourceId, true))
        insertNode(targetNode, position)
      }
    } else {
      // 从外部拖拽进来的无ID，insert
      if (absolute) {
        targetNode.node = getSchema()
        data.props = data.props || {}
        data.props.style = {
          position: 'absolute',
          top: dragState.mouse.y + 'px',
          left: dragState.mouse.x + 'px'
        }
      }

      insertNode(targetNode, position)
    }
  }

  // 重置拖拽状态
  dragEnd()
}

export const setPageCss = (css = '') => {
  const id = 'page-css'
  const document = getDocument()
  let element = document.getElementById(id)
  const head = document.querySelector('head')

  document.body.setAttribute('style', '')

  if (!element) {
    element = document.createElement('style')
    element.setAttribute('type', 'text/css')
    element.setAttribute('id', id)

    element.innerHTML = css
    head.appendChild(element)
  } else {
    element.innerHTML = css
  }
}

export const addStyle = (href) => appendStyle(href, getDocument())

export const addScript = (src) => appendScript(src, getDocument())

/**
 *
 * @param {*} messages
 * @param {*} merge 是否合并，默认是重置所有数据
 */
export const setLocales = (messages, merge) => {
  const i18n = getRenderer().getI18n()

  Object.keys(messages).forEach((lang) => {
    const fn = merge ? 'mergeLocaleMessage' : 'setLocaleMessage'
    i18n.global[fn](lang, messages[lang])
  })
}

export const setState = (state) => {
  getRenderer().setState(state)
}

export const setUtils = (utils, clear, isForceRefresh) => {
  getRenderer().setUtils(utils, clear, isForceRefresh)
}

export const updateUtils = (utils) => {
  getRenderer().updateUtils(utils)
}

export const deleteUtils = (utils) => {
  getRenderer().deleteUtils(utils)
}

export const deleteState = (variable) => {
  getRenderer().deleteState(variable)
}

export const setGlobalState = (state) => {
  useResource().resState.globalState = state
  getRenderer().setGlobalState(state)
}

export const getNodePath = (id, nodes = []) => {
  const { parent, node } = getNode(id, true) || {}

  node && nodes.unshift({ name: node.componentName, node: id })

  if (parent) {
    parent && getNodePath(parent.id, nodes)
  } else {
    nodes.unshift({ name: 'BODY', node: id })
  }

  return nodes
}

export const setSchema = async (schema) => {
  clearHover()
  clearSelect()
  canvasState.schema = await getRenderer()?.setSchema(schema)

  return canvasState.schema
}

export const setConfigure = (configure) => {
  getRenderer().setConfigure(configure)
}

export const setProps = (data) => getRenderer()?.setProps(data)

export const setI18n = (data) => {
  const messages = data || useTranslate().getData()
  const i18n = getRenderer().getI18n()
  Object.keys(messages).forEach((lang) => {
    i18n.global.mergeLocaleMessage(lang, messages[lang])
  })
}

export const setCanvasType = (type) => {
  canvasState.type = type || 'normal'
  getDocument().body.className = type === 'absolute' ? 'canvas-grid-bg' : ''
}

export const getCanvasType = () => canvasState.type

/**
 * 画布派发事件
 * @param {string} name 事件名称
 * @param {any} data 派发的数据
 */
export const canvasDispatch = (name, data, doc = getDocument()) => {
  if (!doc) return

  doc.dispatchEvent(new CustomEvent(name, data))
}

export const canvasApi = {
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
  canvasDispatch,
  Builtin,
  setDataSourceMap: (...args) => {
    return canvasState.renderer.setDataSourceMap(...args)
  },
  getDataSourceMap: (...args) => {
    return canvasState.renderer.getDataSourceMap(...args)
  }
}

export const initCanvas = ({ renderer, iframe, emit, controller }) => {
  const currentSchema = getSchema()

  // 在点击刷新按钮的情况下继续保留最新的schema.json
  const schema = currentSchema ? currentSchema : useCanvas().getPageSchema()

  canvasState.iframe = iframe
  canvasState.emit = emit
  // 存放画布外层传进来的插件api
  canvasState.controller = controller
  canvasState.renderer = renderer
  renderer.setController(controller)
  setLocales(useTranslate().getData(), true)
  if (isVsCodeEnv) {
    const parent = window.parent
    const senterMessage = parent.postMessage
    // 发消息给webview
    senterMessage({ type: 'i18nReady', value: true }, '*')
  }

  setGlobalState(useResource().resState.globalState)
  renderer.setDataSourceMap(useResource().resState.dataSource)
  // 设置画布全局的utils工具类上下文环境
  setUtils(useResource().resState.utils)
  setSchema(schema)
  setConfigure(useResource().getConfigureMap())
  canvasDispatch('updateDependencies', { detail: useResource().resState.thirdPartyDeps })
  canvasState.loading = false
}
