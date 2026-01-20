import { HTTP_CONFIG, ERROR_MESSAGES, DEEPSEEK_CONFIG } from '../constants.js'

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
export async function callDeepSeekAPI(prompt, suffix, config, apiKey, baseUrl) {
  // 构建 DeepSeek FIM API URL：将 /v1 替换为 /beta/completions
  const completionsUrl = baseUrl.replace(DEEPSEEK_CONFIG.PATH_REPLACE, DEEPSEEK_CONFIG.COMPLETION_PATH) + '/completions'

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

  const fetchResponse = await fetch(completionsUrl, {
    method: HTTP_CONFIG.METHOD,
    headers: {
      'Content-Type': HTTP_CONFIG.CONTENT_TYPE,
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!fetchResponse.ok) {
    const errorText = await fetchResponse.text()
    throw new Error(`${ERROR_MESSAGES.REQUEST_FAILED} ${fetchResponse.status}: ${errorText}`)
  }

  const response = await fetchResponse.json()
  return response?.choices?.[0]?.text
}
