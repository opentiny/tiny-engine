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
  NODE_TAG
  // NODE_LOOP,
  // NODE_INACTIVE_UID
} from '../../common'
import { useCanvas, useTranslate, useMaterial, getOptions, useHistory } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { isVsCodeEnv } from '@opentiny/tiny-engine-common/js/environments'
import Builtin from '../../render/src/builtin/builtin.json' //TODO 画布内外应该分开
// import { useMultiSelect } from './composables/useMultiSelect'
import { useHoverNode, useSelectNode } from './interactions'
import type { Node, RootNode } from '../../types'

export interface DragOffset {
  offsetX: number
  offsetY: number
  horizontal: string
  vertical: string
  width: number
  height: number
  x: number
  y: number
}

export const POSITION = Object.freeze({
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  IN: 'in',
  OUT: 'out',
  REPLACE: 'replace'
} as const)

export type PositionType = typeof POSITION[keyof typeof POSITION]

export const initialDragState = {
  keydown: false,
  draging: false,
  data: null as Node | null,
  position: null as { left: number; top: number } | null, // ghost位置
  mouse: {} as { x: number; y: number }, // iframe里鼠标位置
  element: null as Element | null,
  offset: {} as DragOffset,
  timer: 0
}

export const canvasState = shallowReactive({
  type: 'normal',
  schema: null,
  renderer: null as any, // 存放画布内的api
  iframe: {} as HTMLIFrameElement,
  loading: true,
  current: null as any,
  parent: null as any,
  loopId: null as string | null,
  controller: null as any,
  emit: null as any
})

export const getRenderer = () => canvasState.renderer

export const getController = () => canvasState.controller

export const getDocument = () => canvasState.iframe.contentDocument!

export const getWindow = () => canvasState.iframe.contentWindow!

export const getCurrent = () => {
  return {
    schema: canvasState.current,
    parent: canvasState.parent,
    loopId: canvasState.loopId
  }
}

export const getDesignMode = () => getRenderer()?.getDesignMode()

export const setDesignMode = (mode: string) => getRenderer()?.setDesignMode(mode)

export const getSchema = () => useCanvas().getPageSchema()

// 记录拖拽状态
export const dragState = reactive({
  ...initialDragState
})

export const initialRectState = {
  id: '',
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
  doc: null,
  configure: null
}

// 鼠标移入画布中元素时的状态
// export const hoverState = reactive({
//   ...initialRectState
// })

// export const inactiveHoverState = reactive({
//   ...initialRectState
// })

// 拖拽时的位置状态
export const lineState = reactive({
  ...initialLineState
})

// const { multiSelectedStates, toggleMultiSelection, refreshSelectionState, clearMultiSelection } = useMultiSelect()

// export const clearHover = () => {
//   Object.assign(hoverState, initialRectState, { slot: null })
//   Object.assign(inactiveHoverState, initialRectState, { slot: null })
// }

// export const clearSelect = () => {
//   canvasState.current = null
//   canvasState.parent = null
//   clearMultiSelection()
//   // 临时借用 remote 事件出发 currentSchema 更新
//   canvasState?.emit?.('remove')
// }

const smoothScroll = {
  timmer: undefined as ReturnType<typeof setTimeout> | undefined,
  /**
   *
   * @param {boolean} up 方向
   * @param {number} step 每次滚动距离
   * @param {number} time 滚动延时（不得大于系统滚动时长，否则可能出现卡顿效果）
   */
  start(up: boolean, step = 40, time = 100) {
    const dom = getDocument().documentElement
    const fn = () => {
      const top = up ? dom.scrollTop + step : dom.scrollTop - step

      dom.scrollTo({ top, behavior: 'smooth' })
      this.timmer = setTimeout(fn, time)
    }

    if (!this.timmer) {
      fn()
    }
  },
  stop() {
    clearTimeout(this.timmer)
    this.timmer = undefined
  }
}

export const dragStart = (
  data: Node,
  element: Element,
  { offsetX = 0, offsetY = 0, horizontal, vertical, width, height, x, y } = {} as DragOffset
) => {
  // 表示鼠标按下开始拖拽
  dragState.keydown = true
  dragState.data = data || {}

  // 记录上次一开始拖拽的时间
  dragState.timer = Date.now()

  // 如果element存在表示在iframe内部拖拽
  dragState.element = element
  dragState.offset = { offsetX, offsetY, horizontal, vertical, width, height, x, y }

  const { clearHover } = useHoverNode()
  clearHover()
}

export const clearLineState = () => {
  Object.assign(lineState, initialLineState)
}

export const dragEnd = () => {
  const { element, data } = dragState

  if (element && canvasState.type === 'absolute') {
    data!.props = data!.props || {}
    data!.props.style = element.style.cssText

    getController().addHistory()
  }

  // 重置拖拽状态
  Object.assign(dragState, initialDragState)

  // 重置拖拽插入位置状态
  clearLineState()
  smoothScroll.stop()
}

export const getOffset = (element: Element) => {
  if (element.ownerDocument === document) {
    return { x: 0, y: 0, bottom: 0, top: 0 }
  }
  const { x, y, bottom, top } = canvasState.iframe.getBoundingClientRect()
  return { x, y, bottom, top }
}

export const getElement = (element?: Element): Element | undefined => {
  if (!element || element.nodeType !== 1) {
    return undefined
  }

  // 如果当前元素是body
  if (element === element.ownerDocument.body) {
    return element
  }

  // 如果当前元素是画布的html，返回画布的body
  if (element === element.ownerDocument.documentElement) {
    return element.ownerDocument.body
  }

  if (element.getAttribute(NODE_UID)) {
    return element
  } else if (element.parentElement) {
    return getElement(element.parentElement)
  }

  return undefined
}

// export const getInactiveElement = (element?: Element): Element | undefined => {
//   if (
//     !element ||
//     element.nodeType !== 1 ||
//     // 如果当前元素是body或者html，需要排除
//     element === element.ownerDocument.body ||
//     element === element.ownerDocument.documentElement ||
//     // 如果当前元素是RouterView, 则有可能是激活元素处于非激活元素里面，需要排除
//     (element.getAttribute(NODE_TAG) === 'RouterView' && element.getAttribute(NODE_UID))
//   ) {
//     return undefined
//   }

//   if (element.getAttribute(NODE_INACTIVE_UID)) {
//     return element
//   } else if (element.parentElement) {
//     return getInactiveElement(element.parentElement)
//   }

//   return undefined
// }

export const getRect = (element: Element) => {
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

interface InsertOptions {
  parent: Node | RootNode
  node: Node | RootNode
  data: Node
}

const insertAfter = ({ parent, node, data }: InsertOptions) => {
  if (!data.id) {
    data.id = utils.guid()
  }

  useCanvas().operateNode({
    type: 'insert',
    parentId: parent.id || '',
    newNodeData: data,
    position: 'after',
    referTargetNodeId: node.id
  })
}

const insertReplace = ({ parent, node, data }: InsertOptions) => {
  if (!data.id) {
    data.id = utils.guid()
  }

  const nodeIndex = parent.children?.findIndex((child) => child.id === node.id)

  if (nodeIndex !== -1 && nodeIndex !== undefined) {
    useCanvas().operateNode({
      type: 'insert',
      parentId: parent.id || '',
      newNodeData: data,
      position: 'replace',
      referTargetNodeId: node.id
    })
  }
}

const insertBefore = ({ parent, node, data }: InsertOptions) => {
  if (!data.id) {
    data.id = utils.guid()
  }

  useCanvas().operateNode({
    type: 'insert',
    parentId: parent.id || '',
    newNodeData: data,
    position: 'before',
    referTargetNodeId: node.id
  })
}

const insertInner = ({ node, data }: Omit<InsertOptions, 'parent'>, position: string = '') => {
  if (!data.id) {
    data.id = utils.guid()
  }

  useCanvas().operateNode({
    type: 'insert',
    parentId: node.id || '',
    newNodeData: data,
    position: ([POSITION.TOP, POSITION.LEFT] as string[]).includes(position) ? 'before' : 'after'
  })
}

export const removeNode = (id: string) => {
  useCanvas().operateNode({
    type: 'delete',
    id
  })
}

// 添加外部容器
const insertContainer = ({ parent, node, data }: InsertOptions) => {
  if (!data.id) {
    data.id = utils.guid()
  }

  useCanvas().operateNode({
    type: 'insert',
    parentId: parent.id || '',
    newNodeData: data,
    position: POSITION.OUT,
    referTargetNodeId: node.id
  })
}

export const removeNodeById = (id: string) => {
  if (!id) {
    return
  }

  removeNode(id)
  const { clearSelect } = useSelectNode()
  clearSelect()
  getController().addHistory()
  canvasState.emit('remove')
}

export const getConfigure = (targetName: string) => {
  const material = getController().getMaterial(targetName)

  // 这里如果是区块插槽，则返回标识为容器的对象
  if (targetName === 'Template') {
    return {
      isContainer: true
    }
  }

  return material?.content?.configure || material.configure || {}
}

export const querySelectById = (id: string) => {
  const selector = `[${NODE_UID}="${id}"]`
  const doc = getDocument()
  let element = doc.querySelector(selector)
  const node = useCanvas().getNodeById(id)
  const { rootSelector } = getConfigure(node?.componentName)

  // 根据 id 无法查找到 element，尝试使用 rootSelector 查找
  if (!element && rootSelector) {
    // TODO: 拖入了多个相同组件的情况下，如何拿到正确的 element
    const newElement = doc.querySelector(rootSelector)

    if (newElement) {
      element = newElement
    }
  }

  return element
}

export const getCurrentElement = () => querySelectById(getCurrent().schema?.id)

// 滚动页面后，目标元素与页面边界至少保留的边距
const SCROLL_MARGIN = 15

export const scrollToNode = (element?: Element | null) => {
  if (element && element.nodeType === 1) {
    const container = getDocument().documentElement
    const { clientWidth, clientHeight } = container
    const { left, right, top, bottom, width, height } = element.getBoundingClientRect()
    const option: { left?: number; top?: number } = {}

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

export const updateRect = () => {
  const { clearHover } = useHoverNode()
  const { updateSelectedRect } = useSelectNode()
  // 滚动的时候，清空 hover
  clearHover()
  updateSelectedRect()

  // const { type, isMultiple = false } = options || {}
  // const schema = options?.schema || (useCanvas().getNodeWithParentById(id) || {}).node
  // element = element || querySelectById(id) || getDocument().body

  // const { left, height, top, width } = getRect(element)
  // const componentName = schema?.componentName || ''
  // const { node, parent } = useCanvas().getNodeWithParentById(id) || {}

  // return toggleMultiSelection(
  //   {
  //     id,
  //     left,
  //     height,
  //     top,
  //     width,
  //     componentName,
  //     doc: getDocument(),
  //     schema: node,
  //     parent,
  //     type
  //   },
  //   isMultiple
  // )
}

/**
 * 是否允许插入
 * @param {*} configure 当前放置目标的 configure，比如getConfigure(componentName)
 * @param {*} data 当前插入目标的schame数据
 * @returns
 */
export const allowInsert = (configure: any = {}, data: Node | null = dragState.data) => {
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

export const isAncestor = (ancestor: string | Node, descendant: string | Node) => {
  const ancestorId = typeof ancestor === 'string' ? ancestor : ancestor.id
  let descendantId = typeof descendant === 'string' ? descendant : descendant.id

  while (descendantId) {
    const { parent } = useCanvas().getNodeWithParentById(descendantId) || {}

    if (parent?.id === ancestorId) {
      return true
    }

    descendantId = parent?.id
  }

  return false
}

type Rect =
  | DOMRect
  | { left: number; top: number; right: number; bottom: number; width: number; height: number; x: number; y: number }

// 获取位置信息，返回状态
const lineAbs = 20
const getPosLine = (rect: Rect, configure: { isContainer: any }) => {
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
    if (!allowInsert(configure)) {
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

const isBodyEl = (element: Element) => element.nodeName === 'BODY'

const updateLineState = (element?: Element, data?: Node | null) => {
  if (!element) {
    const { clearHover } = useHoverNode()

    return clearHover()
  }
  const componentName = element.getAttribute(NODE_TAG)!
  const id = element.getAttribute(NODE_UID)!
  const configure = getConfigure(componentName)
  const rect = getRect(element)
  const { left, height, top, width } = rect
  const { getSchema, getNodeWithParentById } = useCanvas()

  // hoverState.configure = configure

  if (data) {
    let childEle = null
    lineState.id = id
    lineState.configure = configure
    const rectType = isBodyEl(element) ? POSITION.IN : getPosLine(rect, configure).type

    // 如果拖拽经过的元素是body或者是带有容器属性的盒子，并且在元素内部插入,则需要特殊处理
    if ((isBodyEl(element) || configure?.isContainer) && rectType === POSITION.IN) {
      const { node } = isBodyEl(element) ? { node: getSchema() } : getNodeWithParentById(id) || {}
      const children = node?.children || []
      if (children.length > 0) {
        // 如果容器盒子有子节点，则以最后一个子节点为拖拽参照物
        const lastNode = children[children.length - 1]
        childEle = querySelectById(lastNode.id)

        if (childEle) {
          const childComponentName = childEle!.getAttribute(NODE_TAG)!
          const Childconfigure = getConfigure(childComponentName)
          lineState.id = lastNode.id
          lineState.configure = Childconfigure
        }
      }
    }

    // 如果容器盒子有子元素
    if (childEle) {
      const childRect = getRect(childEle)
      const { left, height, top, width } = childRect
      const posLine = getPosLine(childRect, lineState.configure!)
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
  }

  // 设置元素hover状态
  // Object.assign(hoverState, {
  //   id,
  //   width,
  //   height,
  //   top,
  //   left,
  //   element,
  //   componentName
  // })
  return undefined
}

// const updateHoverRect = (id?: string) => {
//   const element = querySelectById(id || hoverState.id)

//   if (!element) {
//     return
//   }

//   const rect = getRect(element)
//   const { left, height, top, width } = rect

//   Object.assign(hoverState, {
//     width,
//     height,
//     top,
//     left
//   })
// }

// const setInactiveHoverRect = (element?: Element) => {
//   if (!element) {
//     Object.assign(inactiveHoverState, initialRectState, { slot: null })
//     return
//   }

//   const componentName = element.getAttribute(NODE_TAG)!
//   const id = element.getAttribute(NODE_INACTIVE_UID)
//   const configure = getConfigure(componentName)
//   const rect = getRect(element)
//   const { left, height, top, width } = rect

//   inactiveHoverState.configure = configure
//   // 设置元素hover状态
//   Object.assign(inactiveHoverState, {
//     id,
//     width,
//     height,
//     top,
//     left,
//     element,
//     componentName
//   })
// }

export const syncNodeScroll = () => {
  const { updateSelectedRect } = useSelectNode()
  updateSelectedRect()
  // refreshSelectionState()
  // updateHoverRect()
  const { hoverNodeById, curHoverState } = useHoverNode()
  hoverNodeById(curHoverState.value?.node?.id)
}

let moveUpdateTimer: ReturnType<typeof setTimeout> | undefined = undefined

// 绝对布局
const absoluteMove = (event: DragEvent, element: HTMLElement) => {
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

  clearTimeout(moveUpdateTimer)

  const data = dragState.data!
  data.props = data.props || {}

  // 防抖更新位置信息到 schema
  moveUpdateTimer = setTimeout(() => {
    data.props.style = element.style.cssText

    getController().addHistory()
  }, 100)

  updateRect()
}

interface SetDragPositionOptions {
  clientX: number
  x: number
  clientY: number
  y: number
  offsetBottom: number
  offsetTop: number
}

const setDragPosition = ({ clientX, x, clientY, y, offsetBottom, offsetTop }: SetDragPositionOptions) => {
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

export const dragMove = (event: DragEvent) => {
  if (!dragState.draging && dragState.keydown && new Date().getTime() - dragState.timer < 200) {
    return
  }

  const eventTarget = event.target as Element

  const { x, y, bottom: offsetBottom, top: offsetTop } = getOffset(eventTarget)
  const { clientX, clientY } = event
  const { element } = dragState
  const absolute = canvasState.type === 'absolute'

  dragState.draging = dragState.keydown

  dragState.mouse = { x: clientX, y: clientY }

  // 如果仅仅是mouseover事件直接return,并重置拖拽位置状态，优化性能
  // if (isHover) {
  //   lineState.position = ''
  //   setHoverRect(getElement(eventTarget), null)
  //   setInactiveHoverRect(getInactiveElement(eventTarget))
  //   return
  // }

  updateLineState(getElement(eventTarget), dragState.data)

  if (dragState.draging) {
    // 绝对布局时走的逻辑
    if (element && absolute) {
      absoluteMove(event, element as HTMLElement)
    }
    setDragPosition({ clientX, x, clientY, y, offsetBottom, offsetTop })
  }
}

// type == clickTree, 为点击大纲; type == loop-id=xxx ,为点击循环数据
/**
 * @deprecated 后续废弃，改为使用 useSelectNode().selectNodeById
 * @param {*} id
 * @param {*} type
 * @returns
 */
export const selectNode = async (id: string, type?: string, isMultiple = false) => {
  const { selectNodeById } = useSelectNode()
  selectNodeById(id, type || '', isMultiple)

  // const { node } = useCanvas().getNodeWithParentById(id) || {}

  // let element = querySelectById(id)

  // if (element && node) {
  //   const { rootSelector } = getConfigure(node.componentName)
  //   element = rootSelector ? element.querySelector(rootSelector) : element
  // }

  // const nodeIsSelected = setSelectRect(id, element, { isMultiple, type, schema: node })

  // // 执行setSelectRect之后再去判断multiSelectedStates的长度
  // if (multiSelectedStates.value.length === 1) {
  //   const { schema: node, parent, type } = multiSelectedStates.value[0]
  //   const loopId = type?.includes('loop-id') ? type.split('=')[1] : null
  //   Object.assign(canvasState, {
  //     loopId,
  //     current: node,
  //     parent
  //   })
  // } else {
  //   // 没有选中或者有多选，则重置canvasState部份数据
  //   Object.assign(canvasState, {
  //     loopId: null,
  //     current: null,
  //     parent: null
  //   })
  // }

  // if (nodeIsSelected) {
  //   await scrollToNode(element)
  // }

  // if (multiSelectedStates.value.length === 1) {
  //   const { schema: node, parent, type, id } = multiSelectedStates.value[0]
  //   canvasState.emit('selected', node, parent, type, id)
  //   return node
  // } else {
  //   canvasState.emit('selected')
  //   return null
  // }
}

/**
 * @deprecated 后续废弃，改为使用 useHoverNode().hoverNodeById
 * @param {*} id
 */
export const hoverNode = (id: string) => {
  const { hoverNodeById } = useHoverNode()
  hoverNodeById(id)
  // const element = querySelectById(id)
  // if (element) {
  //   setHoverRect(element, data)
  // }
}

export const insertNode = (
  node: { node: Node; parent: Node; data: Node },
  position: PositionType = POSITION.IN,
  select = true
) => {
  if (!node.parent) {
    insertInner({ node: useCanvas().pageState.pageSchema!, data: node.data }, position)
  } else {
    switch (position) {
      case POSITION.TOP:
      case POSITION.LEFT:
        insertBefore(node)
        break
      case POSITION.BOTTOM:
      case POSITION.RIGHT:
        insertAfter(node)
        break
      case POSITION.IN:
        insertInner(node)
        break
      case POSITION.OUT:
        insertContainer(node)
        break
      case POSITION.REPLACE:
        insertReplace(node)
        break
      default:
        insertInner(node)
        break
    }
  }

  if (select) {
    // setTimeout(() => selectNode(node.data.id))
    const { selectNodeById } = useSelectNode()
    // TODO: 这里延时100ms 再选中，确保画布已经更新，后续可以尝试监听画布事件，画布发出来更新完成事件
    setTimeout(() => selectNodeById(node.data.id, ''), 100)
  }

  getController().addHistory()
}

export const addComponent = (data: Node, position: string) => {
  const { schema, parent } = getCurrent()

  insertNode({ node: schema, parent, data }, position)
}

export const copyNode = (id: string) => {
  if (!id) {
    return
  }

  const { node, parent } = useCanvas().getNodeWithParentById(id)!

  insertAfter({ parent, node, data: copyObject(node) })
  getController().addHistory()
}

export const onMouseUp = () => {
  const { draging } = dragState
  const { position, forbidden } = lineState
  const absolute = canvasState.type === 'absolute'
  const lineId = lineState.id
  const { getNodeWithParentById, getSchema } = useCanvas()

  if (draging && !forbidden) {
    const { parent, node } = getNodeWithParentById(lineId) || {} // target
    const data = dragState.data!
    const sourceId = data.id

    const insertData = toRaw(data)
    const targetNode = { parent, node, data: { ...insertData, children: insertData.children || [] } }

    if (sourceId) {
      // 内部拖拽
      if (sourceId !== lineId && !absolute) {
        removeNode(sourceId)
        insertNode(targetNode, position)
      }
    } else {
      // 从外部拖拽进来的无ID，insert
      if (absolute) {
        targetNode.node = getSchema()
        data.props = data.props || {}
        data.props.style = `position: absolute; top: ${dragState.mouse.y}px; left: ${dragState.mouse.x}px`
      }

      insertNode(targetNode, position)
    }
  }

  // 重置拖拽状态
  dragEnd()
}

export const addStyle = (href: string) => appendStyle(href, getDocument())

export const addScript = (src: string) => appendScript(src, getDocument())

/**
 *
 * @param {*} messages
 * @param {*} merge 是否合并，默认是重置所有数据
 */
export const setLocales = (messages: any, merge?: boolean) => {
  const i18n = getRenderer()?.getI18n?.()

  if (!i18n) {
    return
  }

  Object.keys(messages).forEach((lang) => {
    const fn = merge ? 'mergeLocaleMessage' : 'setLocaleMessage'
    i18n.global[fn](lang, messages[lang])
  })
}

export const setConfigure = (configure: any) => {
  getRenderer().setConfigure(configure)
}

export const setI18n = (data: any) => {
  const messages = data || useTranslate().getData()
  const i18n = getRenderer().getI18n()
  Object.keys(messages).forEach((lang) => {
    i18n.global.mergeLocaleMessage(lang, messages[lang])
  })
}

export const setCanvasType = (type: string) => {
  canvasState.type = type || 'normal'
  getDocument().body.className = type === 'absolute' ? 'canvas-grid-bg' : ''
}

export const getCanvasType = () => canvasState.type

/**
 * 画布派发事件
 * @param {string} name 事件名称
 * @param {any} data 派发的数据
 */
export const canvasDispatch = (name: string, data: any, doc = getDocument()) => {
  if (!doc) return

  doc.dispatchEvent(new CustomEvent(name, data))
}

/**
 * 获取选中节点在父节点children中的索引位置
 * @param {children} children 父节点的children
 * @param {string[]} selectedIds 选中的节点ID列表
 * @returns {number[]} 排序后的索引数组
 */
const getSelectedNodeIndices = (children: Node[], selectedIds: string[]): number[] => {
  return selectedIds
    .map((id) => children.findIndex((child: Node) => child.id === id))
    .filter((index) => index !== -1)
    .sort((a, b) => a - b)
}

/**
 * 获取组件基础样式的className
 * @returns {string} 组件基础样式类名
 */
const getComponentBaseStyleClassName = () => {
  const materialsOptions = getOptions('engine.plugins.materials') || {}
  return materialsOptions.useBaseStyle && materialsOptions.componentBaseStyle?.className
    ? materialsOptions.componentBaseStyle.className
    : ''
}

/**
 * 判断选中的节点是否都是兄弟节点且是连续的
 * @returns {boolean} 如果所有选中节点都有相同的父节点且在父节点的children中是连续的，返回true；否则返回false
 */
export const areSiblingNodes = (): boolean => {
  const { selectState } = useSelectNode()
  if (selectState.value.length <= 1) return false

  // 一次性获取所有选中节点及其父节点信息
  const canvas = useCanvas()
  const nodesWithParent = selectState.value.map((state) => canvas.getNodeWithParentById(state.node?.id) || {})

  // 检查所有节点是否都有父节点
  if (nodesWithParent.some((node) => !node.parent)) return false

  // 获取第一个父节点并检查所有节点是否有相同的父节点
  const firstParent = nodesWithParent[0].parent
  const parentId = firstParent.id

  if (nodesWithParent.some((node) => node.parent.id !== parentId)) return false

  // 获取并检查索引
  const selectedIds = selectState.value.map((state) => state.node?.id)
  const nodeIndices = getSelectedNodeIndices(firstParent.children, selectedIds)

  // 检查索引是否连续
  return nodeIndices.every((value, index) => value === nodeIndices[0] + index)
}

/**
 * 创建TinyPopover组件结构
 * @param {Object} props 组件属性
 * @param {Node | Node[]} content 内容节点
 * @returns {Node} TinyPopover组件结构
 */
const createTinyPopoverSchema = (props: Record<string, any> = {}, content: Node | Node[]): Node => {
  const children = Array.isArray(content) ? content : [content]

  return {
    componentName: 'TinyPopover',
    id: utils.guid(),
    props: {
      width: 200,
      title: '弹框标题',
      trigger: 'manual',
      modelValue: true,
      ...props
    },
    children: [
      {
        componentName: 'Template',
        id: utils.guid(),
        props: {
          slot: 'reference'
        },
        children
      },
      {
        componentName: 'Template',
        id: utils.guid(),
        props: {
          slot: 'default'
        },
        children: [
          {
            componentName: 'div',
            id: utils.guid(),
            props: {
              placeholder: '提示内容'
            }
          }
        ]
      }
    ]
  }
}

/**
 * 创建包装组件架构
 * @param {string} componentName 组件名称
 * @param {Object} props 组件属性
 * @param {Schema} childSchema 子组件架构
 * @returns {Schema} 包装组件架构
 */
const createWrapperSchema = (componentName: string, props: Record<string, any> = {}, childSchema: Node): Node => {
  let wrapSchema: Node = {
    componentName,
    id: utils.guid(),
    props: {
      content: '提示信息',
      ...props,
      // 如果是div且基础样式类名不为空，才添加className
      ...(componentName === 'div' && getComponentBaseStyleClassName()
        ? { className: getComponentBaseStyleClassName() }
        : {})
    },
    children: [childSchema]
  }

  // 需要对popover特殊处理
  if (componentName === 'TinyPopover') {
    wrapSchema = createTinyPopoverSchema(props, childSchema)
  }

  return wrapSchema
}

/**
 * 批量为多个节点添加相同的父级
 * @param {string} componentName 父级组件名称
 * @param {Object} props 父级组件属性
 * @returns {boolean} 操作成功返回true，否则返回false
 */
export const batchAddParent = (componentName: string, props: Record<string, any> = {}): boolean => {
  const { selectState } = useSelectNode()
  if (selectState.value.length === 0) {
    return false
  }

  // 记录创建的父容器ID，用于后续选中
  const newParentIds: string[] = []

  selectState.value.forEach((state) => {
    if (!state.node) {
      return
    }

    const { parent, node } = useCanvas().getNodeWithParentById(state.node?.id) || {}

    if (!parent) {
      return
    }

    const index = parent.children.findIndex((child) => child.id === node.id)
    if (index === -1) {
      return
    }

    // 创建包装组件的模板，并确保有唯一ID
    const wrapSchema = createWrapperSchema(componentName, props, node)
    wrapSchema.id = utils.guid()
    newParentIds.push(wrapSchema.id)

    // 记录当前节点
    const originalNode = node

    // 使用insertNode将包装组件替换原节点
    insertNode(
      {
        node: originalNode,
        parent,
        data: wrapSchema
      },
      POSITION.REPLACE,
      false
    )
  })

  // TODO: 更新选中状态
  // updateSelectionAfterAddParent(newParentIds)

  // 添加历史记录
  useHistory().addHistory()
  return true
}

/**
 * 为一组兄弟节点添加共同的父级
 * @param {string} componentName 父级组件名称
 * @param {Object} props 父级组件属性
 * @returns {boolean} 操作成功返回true，否则返回false
 */
export const groupAddParent = (componentName: string, props: Record<string, any> = {}): boolean => {
  if (!areSiblingNodes()) {
    return false
  }

  const { selectState } = useSelectNode()
  const firstState = selectState.value[0].node
  const { parent } = useCanvas().getNodeWithParentById(firstState.id) || {}

  if (!parent) {
    return false
  }

  // 收集所有选中的节点ID
  const selectedIds = selectState.value.map((state) => state.node?.id)

  // 找出所有选中节点在父节点children中的索引位置
  const indices = getSelectedNodeIndices(parent.children, selectedIds)

  if (indices.length === 0) return false

  // 获取第一个和最后一个选中节点的索引
  const firstIndex = indices[0]

  // 复制选中的节点（不从原来的位置移除）
  const selectedNodes = indices.map((index) => parent.children[index])

  // 创建新的包装组件
  let wrapSchema: Node = {
    componentName,
    id: utils.guid(),
    props: {
      ...props,
      // 如果是div且基础样式类名不为空，才添加className
      ...(componentName === 'div' && getComponentBaseStyleClassName()
        ? { className: getComponentBaseStyleClassName() }
        : {})
    },
    children: selectedNodes
  }

  // 特殊处理 TinyPopover 等组件
  if (componentName === 'TinyPopover') {
    wrapSchema = createTinyPopoverSchema(props, selectedNodes)
  }

  // 从后向前删除原来的节点，避免索引变化
  for (let i = indices.length - 1; i >= 0; i--) {
    parent.children.splice(indices[i], 1)
  }

  // 将新容器插入到第一个选中节点的位置
  parent.children.splice(firstIndex, 0, wrapSchema)

  // 先更新nodesMap中的节点关系
  const canvas = useCanvas()

  // 设置新创建的父节点
  canvas.setNode(wrapSchema, parent)

  // 为所有子节点更新父节点关系
  selectedNodes.forEach((node) => {
    canvas.setNode(node, wrapSchema)
  })

  // 更新canvasState，保证向左箭头显示
  Object.assign(canvasState, {
    current: wrapSchema,
    parent: parent
  })

  // TODO: 更新选中状态
  // updateSelectionAfterAddParent([wrapSchema.id])

  useHistory().addHistory()
  return true
}

export const canvasApi = {
  dragStart,
  updateRect,
  syncNodeScroll,
  dragMove,
  setLocales,
  getRenderer,
  clearSelect: () => {
    const { clearSelect } = useSelectNode()

    return clearSelect()
  },
  selectNodeById: (id: string, type: string, isMultipleSelect = false) => {
    const { selectNodeById } = useSelectNode()

    return selectNodeById(id, type, isMultipleSelect)
  },
  selectNode,
  hoverNode,
  hoverNodeById: (id: string) => {
    const { hoverNodeById } = useHoverNode()

    return hoverNodeById(id)
  },
  insertNode,
  removeNode,
  addComponent,
  addScript,
  addStyle,
  getCurrent,
  setI18n,
  getCanvasType,
  setCanvasType,
  getDesignMode,
  setDesignMode,
  getDocument,
  canvasDispatch,
  getConfigure,
  allowInsert,
  Builtin,
  removeBlockCompsCache: (...args: any[]) => {
    return canvasState.renderer.removeBlockCompsCache(...args)
  },
  updateCanvas: (...args: any[]) => {
    return canvasState.renderer.updateCanvas(...args)
  },
  dragEnd
}

export const initCanvas = ({ renderer, iframe, emit, controller }: any) => {
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

  setConfigure(useMaterial().getConfigureMap())
  canvasState.loading = false
}
