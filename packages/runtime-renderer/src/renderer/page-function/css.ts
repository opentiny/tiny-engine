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
import config from '../../../config.ts'

export function getBlockCssScopeId(fileName?: string): string {
  const invalidateCharRE = /[^a-z0-9-]/g
  const normalized = String(fileName || 'default')
    .toLowerCase()
    .replace(invalidateCharRE, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `data-render-block-${normalized}`
}

export function normalizeScopeKey(pageId?: string, isBlock?: boolean): string {
  const id = String(pageId)
  if (!id) {
    return 'data-render-page-default'
  } else if (id.startsWith('data-render-')) {
    return id
  } else if (isBlock) {
    return getBlockCssScopeId(id)
  } else {
    return `data-render-page-${id}`
  }
}

export function handleScopedCss(id: string, content: string) {
  const plugins = id ? [scopedPlugin(id)] : []
  return postcss(plugins).process(content, { from: undefined })
}

export function addStyle(key: string, content: string) {
  if (!content) return
  let styleSheet = document.querySelector(`#${key}`)

  if (!styleSheet) {
    styleSheet = document.createElement('style')
    styleSheet.setAttribute('id', key)
    if (config.enableTailwindCSS) {
      styleSheet.setAttribute('type', 'text/tailwindcss')
    }
    document.head.appendChild(styleSheet)
  }
  const id = { [key]: key, 'app-global-css': '' }[key]
  handleScopedCss(id, content).then((scopedCss) => {
    styleSheet.textContent = scopedCss.css
  })
}
export function setPageCss(css: string = '', pageId?: string): void {
  addStyle(normalizeScopeKey(pageId), css)
}

function clearPageCss(key: string): void {
  const styleSheet = document.querySelector(`#${key}`)
  if (styleSheet) {
    styleSheet.remove()
  }
}

function clearAllPageCSS(): void {
  const styleSheets = document.head.querySelectorAll('[id^="data-render-page-"]')
  styleSheets?.forEach((styleSheet) => {
    styleSheet.remove()
  })
}
export default {
  setPageCss,
  clearPageCss,
  clearAllPageCSS
}
