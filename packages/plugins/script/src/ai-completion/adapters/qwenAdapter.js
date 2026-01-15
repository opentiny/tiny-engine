/**
 * Qwen 专用适配器
 * 使用 Completions API + FIM (Fill-In-the-Middle)
 */
import { QWEN_CONFIG, HTTP_CONFIG, ERROR_MESSAGES } from '../constants.js'

/**
 * 构建 Qwen FIM 格式的 messages
 * @param {string} fileContent - 文件内容（包含 [CURSOR] 标记）
 * @param {Object} fimBuilder - FIM 构建器实例
 * @returns {{ messages: Array, cursorContext: Object }} Messages 和上下文
 */
export function buildQwenMessages(fileContent, fimBuilder) {
  const { fimPrompt, cursorContext } = fimBuilder.buildOptimizedFIMPrompt(fileContent)

  return {
    messages: [
      {
        role: 'user',
        content: fimPrompt
      }
    ],
    cursorContext
  }
}

/**
 * 调用 Qwen Completions API
 * @param {Array} messages - Messages 数组
 * @param {Object} config - 配置对象
 * @param {string} apiKey - API 密钥
 * @param {string} baseUrl - 基础 URL
 * @returns {Promise<string>} 补全文本
 */
export async function callQwenAPI(messages, config, apiKey, baseUrl) {
  // 构建完整的 Completions API URL
  const completionsUrl = `${baseUrl}${QWEN_CONFIG.COMPLETION_PATH}`

  const requestBody = {
    model: config.model,
    prompt: messages[0].content, // FIM prompt
    max_tokens: config.maxTokens,
    temperature: QWEN_CONFIG.DEFAULT_TEMPERATURE,
    top_p: QWEN_CONFIG.TOP_P,
    stream: HTTP_CONFIG.STREAM,
    stop: config.stopSequences,
    presence_penalty: QWEN_CONFIG.PRESENCE_PENALTY
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
    throw new Error(`${ERROR_MESSAGES.QWEN_API_ERROR} ${fetchResponse.status}: ${errorText}`)
  }

  const response = await fetchResponse.json()
  return response?.choices?.[0]?.text
}
