/**
 * 根据 vue 实例的位置计算出其在页面上的位置
 * inspire by vuejs/devtools
 * repo: https://github.com/vuejs/devtools
 * location: https://github.com/vuejs/devtools/blob/main/packages/devtools-kit/src/core/component/state/bounding-rect.ts
 */

import type { VueInstanceInternal } from './common'

let range: Range | null = null

const getTextRect = (node: Node): DOMRect => {
  if (!range) {
    range = document.createRange()
  }

  range.selectNode(node)

  return range.getBoundingClientRect()
}

export type Rect = {
  top: number
  right: number
  bottom: number
  left: number
  readonly width: number
  readonly height: number
}

function createRect(): Rect {
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

const mergeRects = (a: Rect, b: DOMRect | Rect): Rect => {
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

export const getFragmentRect = (instance: VueInstanceInternal): Rect => {
  const rect = createRect()

  if (!instance.children) {
    return rect
  }

  for (const child of instance.children) {
    let childRect: DOMRect | Rect | undefined

    if (child.component) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      childRect = getElementRectByInstance(child.component)
    } else if (child.el) {
      const el = child.el

      if (el.nodeType === 1 || el.getBoundingClientRect) {
        childRect = el.getBoundingClientRect()
      } else if (el.nodeType === 3 && el.data?.trim()) {
        childRect = getTextRect(el)
      }
    }

    if (childRect) {
      mergeRects(rect, childRect)
    }
  }

  return rect
}

export const getElementRectByInstance = (instance: VueInstanceInternal): Rect | undefined => {
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

  return undefined
}
