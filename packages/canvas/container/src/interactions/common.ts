import type { Ref } from 'vue'
import { NODE_INACTIVE_UID, NODE_UID } from '../../../common'
import { getWindow, querySelectById } from '../container'

// 定义hover状态结构
export interface HoverOrSelectState {
  rect: {
    top: number
    height: number
    width: number
    left: number
  }
  node: any
  configure: any
  element: any
  componentName: string
  isInactiveNode?: boolean
}

// 自定义Vue实例内部类型，适配当前项目的Vue实例结构
export interface VueInstanceInternal {
  type?: {
    description?: string
  }
  el?: HTMLElement & {
    nodeType: number
    getBoundingClientRect?: () => DOMRect
    data?: string
  }
  component?: VueInstanceInternal
  subTree?: VueInstanceInternal
  children?: VueInstanceInternal[]
  vnode?: {
    el: HTMLElement
  }
  props?: {
    schema?: {
      id?: string
    }
  }
  attrs?: Record<string, any>
  parent?: VueInstanceInternal
}

// 扩展HTMLElement接口，添加__vueComponent属性
export interface HTMLElementWithVue extends HTMLElement {
  __vueComponent?: VueInstanceInternal
  data?: string
}

export const initialHoverState = {
  rect: {
    top: 0,
    height: 0,
    width: 0,
    left: 0
  },
  node: null,
  configure: null,
  element: null,
  componentName: ''
}

export const clearHover = (hoverState: Ref<HoverOrSelectState>) => {
  hoverState.value = {
    ...initialHoverState,
    rect: { ...initialHoverState.rect }
  }
}

export const getClosedElementHasUid = (element: Element | null): Element | undefined => {
  // QUESTION: 为什么要判断 node Type?
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

  if (element.getAttribute(NODE_UID) || element.getAttribute(NODE_INACTIVE_UID)) {
    return element
  } else if (element.parentElement) {
    return getClosedElementHasUid(element.parentElement)
  }

  return undefined
}

export const getWindowRect = () => {
  const { innerHeight, innerWidth } = getWindow()

  return {
    top: 0,
    left: 0,
    width: innerWidth,
    height: innerHeight
  }
}

export const hoverNodeById = (id: string, updateHoverNode: (e: MouseEvent) => void) => {
  const element = querySelectById(id)

  if (element) {
    updateHoverNode({ target: element } as unknown as MouseEvent)
  }
}

export const selectNodeById = async (
  updateSelectedNode: (e: MouseEvent, type: string) => void,
  id: string,
  type: string
) => {
  const element = querySelectById(id)

  if (element) {
    updateSelectedNode({ target: element } as unknown as MouseEvent, type)
  }
}
