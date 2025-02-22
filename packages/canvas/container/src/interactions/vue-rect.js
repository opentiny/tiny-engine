

/**
 * 根据 vue 实例的位置计算出其在页面上的位置
 * inspire by vuejs/devtools
 * repo: https://github.com/vuejs/devtools
 * location: https://github.com/vuejs/devtools/blob/main/packages/devtools-kit/src/core/component/state/bounding-rect.ts
 */

let range

const getTextRect = (node) => {
  if (!range) {
    range = document.createRange()
  }

  range.selectNode(node)

  return range.getBoundingClientRect()
}

function createRect() {
  const rect = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    get width() {
      return rect.right - rect.left
    },
    get height() {
      return rect.bottom - rect.top
    }
  }

  return rect
}

const mergeRects = (a, b) => {
  if (!a.top || b.top < a.top) {
    a.top = b.top
  }

  if (!a.bottom || b.bottom > a.bottom) {
    a.bottom = b.bottom
  }

  if (!a.left || b.left < a.left) {
    a.left = b.left
  }

  if (!a.right || b.right > a.right) {
    a.right = b.right
  }

  return a
}

export const getFragmentRect = (instance) => {
  const rect = createRect()

  if (!instance.children) {
    return rect
  }

  for (const child of instance.children) {
    let childRect

    if (child.component) {
      childRect = getElementRectByInstance(child.component)
    } else if (child.el) {
      const el = child.el

      if (el.nodeType === 1 || el.getBoundingClientRect) {
        childRect = el.getBoundingClientRect()
      } else if (el.nodeType === 3 && el.data.trim()) {
        childRect = getTextRect(el)
      }
    }

    if (childRect) {
      mergeRects(rect, childRect)
    }
  }

  return rect
}

export const getElementRectByInstance = (instance) => {
  if (instance?.type?.description === 'v-fgt') {
    return getFragmentRect(instance)
  }

  if (instance.el?.nodeType === 1) {
    return instance.el.getBoundingClientRect()
  }

  if (instance.component) {
    return getElementRectByInstance(instance.component)
  }

  if (instance.subTree) {
    return getElementRectByInstance(instance.subTree)
  }
}
