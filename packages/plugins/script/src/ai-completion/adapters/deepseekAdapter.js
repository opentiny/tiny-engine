/**
 * DeepSeek 专用适配器
 * 使用 Chat Completions API（通过后端代理）
 */
import { SYSTEM_BASE_PROMPT, createUserPrompt } from '../prompts/templates.js'
import { API_ENDPOINTS, HTTP_CONFIG } from '../constants.js'

/**
 * 构建 DeepSeek Chat 格式的 messages
 * @param {string} context - 上下文信息
 * @param {string} instruction - 指令
 * @param {string} fileContent - 文件内容
 * @returns {{ messages: Array, cursorContext: null }} Messages 和上下文
 */
export function buildDeepSeekMessages(context, instruction, fileContent) {
  const systemPrompt = `${context}\n\n${SYSTEM_BASE_PROMPT}`
  const userPrompt = createUserPrompt(instruction, fileContent)

  return {
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    cursorContext: null
  }
}

/**
 * 调用 DeepSeek Chat API
 * @param {Array} messages - Messages 数组
 * @param {Object} config - 配置对象
 * @param {string} apiKey - API 密钥
 * @param {string} baseUrl - 基础 URL
 * @param {Object} httpClient - HTTP 客户端
 * @returns {Promise<string>} 补全文本
 */
export async function callDeepSeekAPI(messages, config, apiKey, baseUrl, httpClient) {
  const response = await httpClient.post(
    API_ENDPOINTS.CHAT_COMPLETIONS,
    {
      model: config.model,
      messages,
      baseUrl,
      stream: HTTP_CONFIG.STREAM
    },
    {
      headers: {
        'Content-Type': HTTP_CONFIG.CONTENT_TYPE,
        Authorization: `Bearer ${apiKey || ''}`
      }
    }
  )

  return response?.choices?.[0]?.message?.content
}
