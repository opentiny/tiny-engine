import { MODEL_CONFIG, MODEL_COMMON_CONFIG, STOP_SEQUENCES, CONTEXT_STOP_SEQUENCES } from '../constants.js'

/**
 * 检测模型类型
 * @param {string} modelName - 模型名称
 * @returns {'qwen' | 'deepseek' | 'unknown'} 模型类型
 */
export function detectModelType(modelName) {
  if (!modelName) return MODEL_CONFIG.UNKNOWN.TYPE

  const lowerName = modelName.toLowerCase()

  if (MODEL_CONFIG.QWEN.KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
    return MODEL_CONFIG.QWEN.TYPE
  }

  if (MODEL_CONFIG.DEEPSEEK.KEYWORDS.some((keyword) => lowerName.includes(keyword))) {
    return MODEL_CONFIG.DEEPSEEK.TYPE
  }

  return MODEL_CONFIG.UNKNOWN.TYPE
}

/**
 * 计算动态 Token 数量
 * @param {Object} cursorContext - 光标上下文
 * @returns {number} Token 数量
 */
export function calculateTokens(cursorContext) {
  const limits = MODEL_COMMON_CONFIG.TOKEN_LIMITS

  if (!cursorContext) {
    return limits.DEFAULT
  }

  if (cursorContext.needsStatement) {
    return limits.STATEMENT
  } else if (cursorContext.needsExpression) {
    return limits.EXPRESSION
  } else if (cursorContext.inFunction) {
    return limits.FUNCTION
  } else if (cursorContext.inClass) {
    return limits.CLASS
  }

  return limits.DEFAULT
}

// 获取动态停止符（最多 16 个）
export function getStopSequences(cursorContext, _modelType) {
  const stops = []

  // 核心停止符
  stops.push(...STOP_SEQUENCES.CORE)

  if (cursorContext) {
    if (cursorContext.inBlockComment || cursorContext.inLineComment) {
      stops.push(...CONTEXT_STOP_SEQUENCES.COMMENT)
    } else if (cursorContext.needsExpression) {
      stops.push(...CONTEXT_STOP_SEQUENCES.EXPRESSION)
      stops.push(...STOP_SEQUENCES.NEW_SCOPE)
    } else if (cursorContext.inObject) {
      stops.push(...CONTEXT_STOP_SEQUENCES.OBJECT)
      stops.push(...STOP_SEQUENCES.NEW_SCOPE)
    } else if (cursorContext.inFunction) {
      stops.push(...CONTEXT_STOP_SEQUENCES.FUNCTION)
      stops.push(...STOP_SEQUENCES.BLOCK_END)
    } else {
      stops.push(...STOP_SEQUENCES.NEW_SCOPE)
      stops.push(...STOP_SEQUENCES.BLOCK_END)
    }
  } else {
    stops.push(...STOP_SEQUENCES.NEW_SCOPE)
    stops.push(...STOP_SEQUENCES.BLOCK_END)
  }

  const uniqueStops = [...new Set(stops)]

  if (uniqueStops.length > 16) {
    // eslint-disable-next-line no-console
    console.warn(`⚠️ 停止符超过限制: ${uniqueStops.length}，截断到 16 个`)
    return uniqueStops.slice(0, 16)
  }

  return uniqueStops
}
