import { NODE_UID } from '../../../common'
import { getWindow, querySelectById } from '../container'

export const initialHoverState = {
  rect: {
    top: 0,
    height: 0,
    width: 0,
    left: 0,
  },
  node: null,
  configure: null,
  element: null,
  componentName: ''
}

export const clearHover = (hoverState) => {
  hoverState.value = {
    ...initialHoverState,
    rect: { ...initialHoverState.rect }
  }
}

export const getClosedElementHasUid = (element) => {
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

export const hoverNodeById = (id, updateHoverNode) => {
  const element = querySelectById(id)

  if (element) {
    updateHoverNode({ target: element })
  }
}
