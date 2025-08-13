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

/**
 * 解析Vue样式为DSL Schema
 * @param {string} style - 样式字符串
 * @param {Object} options - 解析选项
 * @returns {Object} 样式Schema
 */
export function parseStyle(style, options = {}) {
  if (!style || !style.trim()) {
    return {
      css: '',
      scoped: false,
      lang: 'css'
    }
  }

  // 简单的样式解析，实际项目中可能需要更复杂的CSS解析
  return {
    css: style.trim(),
    scoped: options.scoped || false,
    lang: options.lang || 'css'
  }
}

/**
 * 解析CSS声明
 * @param {string} declarations - CSS声明字符串
 * @returns {Object} 声明对象
 */
function parseDeclarations(declarations) {
  const result = {}

  if (!declarations) {
    return result
  }

  const declarationList = declarations.split(';').filter((d) => d.trim())

  declarationList.forEach((declaration) => {
    const colonIndex = declaration.indexOf(':')
    if (colonIndex > 0) {
      const property = declaration.substring(0, colonIndex).trim()
      const value = declaration.substring(colonIndex + 1).trim()
      result[property] = value
    }
  })

  return result
}

/**
 * 解析CSS规则
 * @param {string} css - CSS字符串
 * @returns {Array} CSS规则数组
 */
export function parseCSSRules(css) {
  if (!css || !css.trim()) {
    return []
  }

  const rules = []

  // 简单的CSS规则提取（实际应该使用专业的CSS解析器）
  const ruleMatches = css.match(/([^{}]+)\s*{([^{}]*)}/g)

  if (ruleMatches) {
    ruleMatches.forEach((ruleMatch) => {
      const match = ruleMatch.match(/([^{}]+)\s*{([^{}]*)}/)
      if (match) {
        const selector = match[1].trim()
        const declarations = match[2].trim()

        rules.push({
          selector,
          declarations: parseDeclarations(declarations)
        })
      }
    })
  }

  return rules
}

/**
 * 提取样式中的CSS变量
 * @param {string} css - CSS字符串
 * @returns {Object} CSS变量对象
 */
export function extractCSSVariables(css) {
  const variables = {}

  if (!css) {
    return variables
  }

  // 匹配CSS变量定义 --variable-name: value;
  const variableMatches = css.match(/--[\w-]+\s*:\s*[^;]+/g)

  if (variableMatches) {
    variableMatches.forEach((match) => {
      const colonIndex = match.indexOf(':')
      if (colonIndex > 0) {
        const name = match.substring(0, colonIndex).trim()
        const value = match.substring(colonIndex + 1).trim()
        variables[name] = value
      }
    })
  }

  return variables
}

/**
 * 检查样式是否包含响应式设计
 * @param {string} css - CSS字符串
 * @returns {boolean} 是否包含媒体查询
 */
export function hasMediaQueries(css) {
  if (!css) {
    return false
  }

  return /@media\s+/.test(css)
}

/**
 * 提取媒体查询
 * @param {string} css - CSS字符串
 * @returns {Array} 媒体查询数组
 */
export function extractMediaQueries(css) {
  const mediaQueries = []

  if (!css) {
    return mediaQueries
  }

  // 简单的媒体查询提取
  const mediaMatches = css.match(/@media[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)

  if (mediaMatches) {
    mediaMatches.forEach((match) => {
      const conditionMatch = match.match(/@media\s+([^{]+)/)
      if (conditionMatch) {
        const condition = conditionMatch[1].trim()
        const content = match.substring(match.indexOf('{') + 1, match.lastIndexOf('}')).trim()

        mediaQueries.push({
          condition,
          content,
          rules: parseCSSRules(content)
        })
      }
    })
  }

  return mediaQueries
}
