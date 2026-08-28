import { useResource, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { MODEL_COMMON_CONFIG } from '../constants.js'

function trimSuffixOverlap(text, suffix = '') {
  if (!text || !suffix) {
    return text
  }

  const candidates = [suffix, suffix.trimStart()].filter(Boolean)
  let bestOverlap = 0

  for (const candidate of candidates) {
    const maxOverlap = Math.min(text.length, candidate.length)

    for (let size = maxOverlap; size > bestOverlap; size--) {
      if (text.endsWith(candidate.slice(0, size))) {
        bestOverlap = size
        break
      }
    }
  }

  return bestOverlap > 0 ? text.slice(0, -bestOverlap) : text
}

/**
 * 构建低代码元数据
 * @returns {Object} 低代码元数据
 */
export function buildLowcodeMetadata() {
  const { dataSource = [], utils = [], bridge = [], globalState = [] } = useResource().appSchemaState || {}
  const { state: pageState = {}, methods = {} } = useCanvas().getPageSchema() || {}
  const currentSchema = useCanvas().getCurrentSchema()

  return {
    dataSource,
    utils,
    bridge,
    globalState,
    state: pageState,
    methods,
    currentSchema
  }
}

/**
 * 清理补全文本
 * @param {string} text - 原始补全文本
 * @param {Object} cursorContext - 光标上下文信息（可选）
 * @param {string} suffix - 光标后的原始文本
 * @returns {string} 清理后的文本
 */
export function cleanCompletion(text, cursorContext = null, suffix = '') {
  if (!text) return text

  let cleaned = text

  // 1. 移除 markdown 代码块
  cleaned = cleaned.replace(MODEL_COMMON_CONFIG.CLEANUP_PATTERNS.MARKDOWN_CODE_BLOCK, '')

  // 2. 移除 [CURSOR] 标记（如果模型返回了它）
  cleaned = cleaned.replace(/\[CURSOR\]/g, '')
  cleaned = cleaned.replace(/\/\/ \[CURSOR\]/g, '')

  // 3. 移除前后空行
  cleaned = cleaned.replace(MODEL_COMMON_CONFIG.CLEANUP_PATTERNS.LEADING_EMPTY_LINES, '')
  cleaned = cleaned.replace(MODEL_COMMON_CONFIG.CLEANUP_PATTERNS.TRAILING_EMPTY_LINES, '')

  // 4. 表达式特殊处理：移除尾部分号
  if (cursorContext?.needsExpression) {
    cleaned = cleaned.replace(MODEL_COMMON_CONFIG.CLEANUP_PATTERNS.TRAILING_SEMICOLON, '')
  }

  // 5. 智能截断：防止返回过多不相关代码
  const lines = cleaned.split('\n')

  // 根据上下文确定最大行数
  const truncation = MODEL_COMMON_CONFIG.TRUNCATION
  const maxLines = cursorContext?.needsExpression
    ? truncation.MAX_LINES.EXPRESSION
    : cursorContext?.inObject
    ? truncation.MAX_LINES.OBJECT
    : truncation.MAX_LINES.DEFAULT

  if (lines.length > maxLines) {
    // 找到合适的截断点
    let cutoffIndex = maxLines
    for (let i = 0; i < maxLines && i < lines.length; i++) {
      const line = lines[i].trim()

      // 在函数/类定义处截断
      if (truncation.CUTOFF_KEYWORDS.some((keyword) => line.startsWith(keyword))) {
        cutoffIndex = i
        break
      }

      // 在闭合大括号处截断（完整的代码块）
      if (truncation.BLOCK_ENDINGS.includes(line)) {
        cutoffIndex = i + 1
        break
      }
    }

    cleaned = lines.slice(0, cutoffIndex).join('\n')
  }

  cleaned = trimSuffixOverlap(cleaned, suffix)

  return cleaned.trim()
}
