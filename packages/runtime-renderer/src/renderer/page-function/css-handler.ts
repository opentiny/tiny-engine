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

interface CSSHandlerOptions {
  pageId?: string
  enableScoped?: boolean
  enableModernCSS?: boolean
}

const fallbackStyleMap = new Map<string, HTMLStyleElement>()
let enableScoped = true

// 简化版的作用域处理，将CSS选择器添加页面作用域
function processScopedCSS(key: string, css: string): string {
  if (!enableScoped) {
    return css
  }

  // 简单的CSS作用域处理
  // 将 body, html 等全局选择器转换为作用域选择器
  return css
    .replace(/body\s*{/g, `body[${key}] {`)
    .replace(/html\s*{/g, `html[${key}] {`)
    .replace(/\*:global\(([^)]+)\)/g, '$1') // 处理:global()语法
    .replace(/:global\(([^)]+)\)/g, '$1') // 处理:global()语法
}

// 使用传统方式设置样式
function setCSS(key: string, css: string): void {
  let styleElement = fallbackStyleMap.get(key)

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('type', 'text/css')
    styleElement.setAttribute('data-te-page', key)
    document.head?.appendChild(styleElement)
    fallbackStyleMap.set(key, styleElement)
  }

  // 处理作用域CSS
  const processedCSS = enableScoped ? processScopedCSS(key, css) : css

  styleElement.textContent = processedCSS
}

// 移除页面CSS
function removePageCss(key: string): void {
  const styleElement = fallbackStyleMap.get(key)
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement)
    fallbackStyleMap.delete(key)
  }
}

// 清理所有样式
function clearAllStyles(): void {
  fallbackStyleMap.forEach((_, key) => {
    removePageCss(key)
  })
}

// 设置页面CSS (保持原有API)
export function setPageCss(css: string = '', pageId?: string): void {
  const cssPageId = pageId || 'default'
  const key = `data-te-page-${cssPageId}`

  if (!css) {
    removePageCss(key)
    return
  }

  setCSS(key, css)
}

// 清理所有CSS（用于页面切换）(保持原有API)
export function clearAllPageCSS(): void {
  clearAllStyles()
}

// 获取全局CSS处理器 (保持向后兼容)
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
    removePageCss
  }
}

// 保持与之前相同的导出接口
export default {
  setPageCss,
  clearAllPageCSS
}
