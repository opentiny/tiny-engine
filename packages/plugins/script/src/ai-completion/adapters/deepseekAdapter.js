import { HTTP_CONFIG, ERROR_MESSAGES, DEEPSEEK_CONFIG } from '../constants.js'
import { fetchWithTimeout } from '../utils/requestUtils.js'

export function buildDeepSeekCompletionsUrl(baseUrl) {
  const normalizedBaseUrl = String(baseUrl || '').trim()

  if (!normalizedBaseUrl) {
    return ''
  }

  const normalizePath = (path = '') => {
    const trimmedPath = path.replace(/\/+$/, '')

    if (trimmedPath.endsWith('/beta/completions')) {
      return trimmedPath
    }

    if (trimmedPath.endsWith('/beta')) {
      return `${trimmedPath}/completions`
    }

    if (/\/v1$/i.test(trimmedPath)) {
      return trimmedPath.replace(/\/v1$/i, '/beta/completions')
    }

    return `${trimmedPath}/beta/completions`
  }

  try {
    const parsedUrl = new URL(normalizedBaseUrl)
    parsedUrl.pathname = normalizePath(parsedUrl.pathname)
    return parsedUrl.toString()
  } catch {
    return normalizePath(normalizedBaseUrl)
  }
}

/**
 * 构建 DeepSeek FIM 格式的请求参数
 * @param {string} fileContent - 文件内容（包含 [CURSOR] 标记）
 * @param {Object} fimBuilder - FIM 构建器实例
 * @param {Object} metadata - 元数据（language, lowcodeMetadata 等）
 * @returns {{ prompt: string, suffix: string, cursorContext: Object }} FIM 参数和上下文
 */
export function buildDeepSeekFIMParams(fileContent, fimBuilder, metadata = {}) {
  const { prefix, suffix, cursorContext } = fimBuilder.buildFIMComponents(fileContent, metadata)

  return {
    prompt: prefix,
    suffix,
    cursorContext
  }
}

/**
 * 调用 DeepSeek FIM Completions API
 * @param {string} prompt - 前缀内容
 * @param {string} suffix - 后缀内容
 * @param {Object} config - 配置对象
 * @param {string} apiKey - API 密钥
 * @param {string} baseUrl - 基础 URL
 * @returns {Promise<string>} 补全文本
 */
export async function callDeepSeekAPI(prompt, suffix, config, apiKey, baseUrl, signal) {
  const completionsUrl = buildDeepSeekCompletionsUrl(baseUrl)

  const requestBody = {
    model: config.model,
    prompt,
    suffix,
    max_tokens: config.maxTokens || DEEPSEEK_CONFIG.FIM.MAX_TOKENS,
    temperature: DEEPSEEK_CONFIG.DEFAULT_TEMPERATURE,
    top_p: DEEPSEEK_CONFIG.TOP_P,
    stream: HTTP_CONFIG.STREAM,
    stop: config.stopSequences
  }

  const fetchResponse = await fetchWithTimeout(
    completionsUrl,
    {
      method: HTTP_CONFIG.METHOD,
      headers: {
        'Content-Type': HTTP_CONFIG.CONTENT_TYPE,
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    },
    HTTP_CONFIG.REQUEST_TIMEOUT_MS,
    signal
  )

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`${ERROR_MESSAGES.REQUEST_FAILED} ${fetchResponse.status}: ${errorText}`)
  }

  const response = await fetchResponse.json()
  return response?.choices?.[0]?.text
}
