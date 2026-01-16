import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { createSmartPrompt } from '../builders/promptBuilder.js'
import { FIMPromptBuilder } from '../builders/fimPromptBuilder.js'
import { detectModelType, calculateTokens, getStopSequences } from '../utils/modelUtils.js'
import { cleanCompletion, buildLowcodeMetadata } from '../utils/completionUtils.js'
import { buildQwenMessages, callQwenAPI } from './qwenAdapter.js'
import { buildDeepSeekMessages, callDeepSeekAPI } from './deepseekAdapter.js'
import { QWEN_CONFIG, DEEPSEEK_CONFIG, DEFAULTS, ERROR_MESSAGES, MODEL_CONFIG } from '../constants.js'

/**
 * 创建请求处理器
 * @returns {Function} 请求处理函数
 */
export function createCompletionHandler() {
  const fimBuilder = new FIMPromptBuilder(QWEN_CONFIG)

  return async (params) => {
    try {
      // 1. 获取 AI 配置
      const { completeModel, apiKey, baseUrl } = getMetaApi(META_SERVICE.Robot).getSelectedQuickModelInfo() || {}

      if (!completeModel || !apiKey || !baseUrl) {
        return {
          completion: null,
          error: ERROR_MESSAGES.CONFIG_MISSING
        }
      }

      // 2. 提取代码上下文
      const {
        textBeforeCursor = '',
        textAfterCursor = '',
        language = DEFAULTS.LANGUAGE,
        filename
      } = params.body?.completionMetadata || {}

      // 3. 构建低代码元数据和 prompt
      const lowcodeMetadata = buildLowcodeMetadata()
      const { context, instruction, fileContent } = createSmartPrompt({
        textBeforeCursor,
        textAfterCursor,
        language,
        filename,
        technologies: DEFAULTS.TECHNOLOGIES,
        lowcodeMetadata
      })

      // 4. 检测模型类型
      const modelType = detectModelType(completeModel)

      let completionText = null
      let cursorContext = null

      // 5. 根据模型类型调用不同的 API
      if (modelType === MODEL_CONFIG.QWEN.TYPE) {
        // ===== Qwen 流程 =====
        const { messages, cursorContext: ctx } = buildQwenMessages(fileContent, fimBuilder)
        cursorContext = ctx

        const config = {
          model: completeModel,
          maxTokens: calculateTokens(cursorContext),
          stopSequences: getStopSequences(cursorContext, MODEL_CONFIG.QWEN.TYPE)
        }

        completionText = await callQwenAPI(messages, config, apiKey, baseUrl)
      } else {
        // ===== DeepSeek 流程（默认） =====
        const { messages } = buildDeepSeekMessages(context, instruction, fileContent)

        // DeepSeek 使用 Chat API，也需要 stop 序列
        const config = {
          model: completeModel,
          stopSequences: getStopSequences(null, MODEL_CONFIG.DEEPSEEK.TYPE)
        }
        const httpClient = getMetaApi(META_SERVICE.Http)

        // 构建 DeepSeek FIM 端点：将 /v1 替换为 /beta
        const completionBaseUrl = baseUrl.replace(DEEPSEEK_CONFIG.PATH_REPLACE, DEEPSEEK_CONFIG.COMPLETION_PATH)

        completionText = await callDeepSeekAPI(messages, config, apiKey, completionBaseUrl, httpClient)
      }

      // 6. 处理补全结果
      if (completionText) {
        completionText = completionText.trim()

        completionText = cleanCompletion(completionText, modelType, cursorContext)

        return {
          completion: completionText,
          error: null
        }
      }

      return {
        completion: null,
        error: ERROR_MESSAGES.NO_COMPLETION
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ AI 补全请求失败:', error)
      return {
        completion: null,
        error: error.message || ERROR_MESSAGES.REQUEST_FAILED
      }
    }
  }
}
