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

import postcss from 'postcss'
import scopedPlugin from './scope-css-plugin'

interface CSSHandlerOptions {
  pageId?: string
  enableScoped?: boolean
  enableModernCSS?: boolean
}

type AdoptedSheets = CSSStyleSheet[] | undefined

const supportsAdoptedStyleSheet =
  typeof document !== 'undefined' && Array.isArray((document as any)?.adoptedStyleSheets)
const styleSheetMap = new Map<string, CSSStyleSheet>()
const fallbackStyleMap = new Map<string, HTMLStyleElement>()
let enableScoped = true

function normalizeScopeKey(pageId?: string): string {
  if (!pageId) {
    return 'data-te-page-default'
  }
  return pageId.startsWith('data-te-page-') ? pageId : `data-te-page-${pageId}`
}

function ensureAdoptedStyleSheet(key: string): CSSStyleSheet {
  let sheet = styleSheetMap.get(key)
  if (!sheet) {
    sheet = new CSSStyleSheet()
    styleSheetMap.set(key, sheet)
    const adoptedSheets = ((document as any).adoptedStyleSheets || []) as AdoptedSheets
    if (!adoptedSheets?.includes(sheet)) {
      ;(document as any).adoptedStyleSheets = [...(adoptedSheets || []), sheet]
    }
  }
  return sheet
}

function ensureFallbackStyleElement(key: string): HTMLStyleElement {
  let styleElement = fallbackStyleMap.get(key)
  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.type = 'text/css'
    styleElement.setAttribute('data-te-page', key)
    document.head?.appendChild(styleElement)
    fallbackStyleMap.set(key, styleElement)
  }
  return styleElement
}

function processScopedCss(key: string, css: string): Promise<string> {
  if (!enableScoped) {
    return Promise.resolve(css)
  }

  return postcss([scopedPlugin(key)])
    .process(css, { from: undefined })
    .then((result) => result.css)
}

function applyCss(key: string, css: string): void {
  if (supportsAdoptedStyleSheet && typeof CSSStyleSheet !== 'undefined') {
    const sheet = ensureAdoptedStyleSheet(key)
    processScopedCss(key, css)
      .then((scopedCss) => {
        sheet.replaceSync(scopedCss)
      })
      .catch(() => {
        sheet.replaceSync(css)
      })
    return
  }

  const styleElement = ensureFallbackStyleElement(key)
  processScopedCss(key, css)
    .then((scopedCss) => {
      styleElement.textContent = scopedCss
    })
    .catch(() => {
      styleElement.textContent = css
    })
}

function removePageCss(key: string): void {
  const sheet = styleSheetMap.get(key)
  if (sheet) {
    styleSheetMap.delete(key)
    const adoptedSheets = ((document as any).adoptedStyleSheets || []) as AdoptedSheets
    if (adoptedSheets?.length) {
      ;(document as any).adoptedStyleSheets = adoptedSheets.filter((item) => item !== sheet)
    }
  }

  const styleElement = fallbackStyleMap.get(key)
  if (styleElement?.parentNode) {
    styleElement.parentNode.removeChild(styleElement)
    fallbackStyleMap.delete(key)
  }
}

function clearAllStyles(): void {
  styleSheetMap.forEach((_, key) => removePageCss(key))
  fallbackStyleMap.forEach((_, key) => removePageCss(key))
}

export function setPageCss(css: string = '', pageId?: string): void {
  const key = normalizeScopeKey(pageId)

  if (!css) {
    removePageCss(key)
    return
  }
  //console.log('setPageCss key', key, css)

  applyCss(key, css)
}

export function clearAllPageCSS(): void {
  clearAllStyles()
}

export function getCSSHandler(options?: CSSHandlerOptions): {
  setPageCss: (css?: string, pageId?: string) => void
  clearAllStyles: () => void
  removePageCss: (key: string) => void
} {
  if (options?.enableScoped !== undefined) {
    enableScoped = options.enableScoped
  }

  return {
    setPageCss,
    clearAllStyles,
    removePageCss: (key: string) => removePageCss(normalizeScopeKey(key))
  }
}

export default {
  setPageCss,
  clearAllPageCSS
}
