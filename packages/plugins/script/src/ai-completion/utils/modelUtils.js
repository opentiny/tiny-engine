import { MODEL_CONFIG, MODEL_COMMON_CONFIG, STOP_SEQUENCES, FIM_CONFIG } from '../constants.js'

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

/**
 * 获取动态停止符
 * @param {Object} cursorContext - 光标上下文
 * @param {string} modelType - 模型类型
 * @returns {string[]} 停止符数组
 */
export function getStopSequences(cursorContext, modelType) {
  // 基础停止符：通用停止符
  const stops = [...STOP_SEQUENCES]

  // Qwen 模型添加 FIM 标记
  if (modelType === 'qwen') {
    stops.push(...FIM_CONFIG.FIM_MARKERS_STOPS)
  }

  if (!cursorContext) {
    return stops
  }

  // 根据上下文添加特定停止符
  if (cursorContext.needsExpression) {
    stops.push(...FIM_CONFIG.CONTEXT_STOPS.EXPRESSION)
  } else if (cursorContext.needsStatement) {
    stops.push(...FIM_CONFIG.CONTEXT_STOPS.STATEMENT)
  } else if (cursorContext.inObject) {
    stops.push(...FIM_CONFIG.CONTEXT_STOPS.OBJECT)
  }

  return stops
}
