import { MODEL_CONFIG, MODEL_COMMON_CONFIG, STOP_SEQUENCES, CONTEXT_STOP_SEQUENCES } from '../constants.js'

/**
 * 检测模型类型
 * @param {string} modelName - 模型名称
 * @param {Object} options - 额外上下文
 * @param {string} options.provider - 服务 provider
 * @param {string} options.baseUrl - 服务 baseUrl
 * @param {Object} options.capabilities - 模型能力
 * @returns {'qwen' | 'deepseek' | 'unknown'} 模型类型
 */
export function detectModelType(modelName, options = {}) {
  if (!modelName) return MODEL_CONFIG.UNKNOWN.TYPE

  const { provider = '', baseUrl = '', capabilities = {} } = options
  if (capabilities?.completionProtocol) {
    return capabilities.completionProtocol
  }

  const lowerName = modelName.toLowerCase()
  const isQwenCompletionModel =
    MODEL_CONFIG.QWEN.COMPLETION_MODELS.some((item) => item === lowerName) ||
    MODEL_CONFIG.QWEN.COMPLETION_MODEL_PATTERNS.some((pattern) => pattern.test(lowerName))
  const isDeepSeekCompletionModel =
    MODEL_CONFIG.DEEPSEEK.COMPLETION_MODELS.some((item) => item === lowerName) ||
    MODEL_CONFIG.DEEPSEEK.COMPLETION_MODEL_PATTERNS.some((pattern) => pattern.test(lowerName))

  if (isQwenCompletionModel) {
    return MODEL_CONFIG.QWEN.TYPE
  }

  if (isDeepSeekCompletionModel) {
    return MODEL_CONFIG.DEEPSEEK.TYPE
  }

  const lowerProvider = provider.toLowerCase()
  const lowerBaseUrl = baseUrl.toLowerCase()
  if (
    isDeepSeekCompletionModel &&
    MODEL_CONFIG.DEEPSEEK.PROVIDERS.some((item) => item === lowerProvider) &&
    MODEL_CONFIG.DEEPSEEK.BASE_URL_KEYWORDS.some((keyword) => lowerBaseUrl.includes(keyword))
  ) {
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
