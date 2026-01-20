import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { createSmartPrompt } from '../builders/promptBuilder.js'
import { FIMPromptBuilder } from '../builders/fimPromptBuilder.js'
import { detectModelType, calculateTokens, getStopSequences } from '../utils/modelUtils.js'
import { cleanCompletion, buildLowcodeMetadata } from '../utils/completionUtils.js'
import { buildQwenMessages, callQwenAPI } from './qwenAdapter.js'
import { buildDeepSeekFIMParams, callDeepSeekAPI } from './deepseekAdapter.js'
import { QWEN_CONFIG, DEEPSEEK_CONFIG, DEFAULTS, ERROR_MESSAGES, MODEL_CONFIG } from '../constants.js'

/**
 * 创建请求处理器
 * @returns {Function} 请求处理函数
 */
export function createCompletionHandler() {
  // 为不同模型创建 FIM 构建器
  const qwenFimBuilder = new FIMPromptBuilder(QWEN_CONFIG)
  const deepseekFimBuilder = new FIMPromptBuilder(DEEPSEEK_CONFIG)

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
      const { fileContent } = createSmartPrompt({
        textBeforeCursor,
        textAfterCursor,
        language,
        filename,
        technologies: DEFAULTS.TECHNOLOGIES,
        lowcodeMetadata
      })

      // 4. 检测模型类型并构建 FIM 参数
      const modelType = detectModelType(completeModel)

      // 5. 准备元数据（用于增强 FIM prompt）
      const fimMetadata = {
        language,
        isComment: textBeforeCursor.trim().endsWith('//') || textBeforeCursor.includes('/*'),
        lowcodeContext: lowcodeMetadata
          ? {
              dataSource: lowcodeMetadata.dataSource || [],
              utils: lowcodeMetadata.utils || [],
              globalState: lowcodeMetadata.globalState || [],
              state: lowcodeMetadata.state || {},
              methods: lowcodeMetadata.methods || {},
              currentSchema: lowcodeMetadata.currentSchema || null
            }
          : null
      }

      // 6. 根据模型类型构建请求参数
      let completionText
      let cursorContext

      if (modelType === MODEL_CONFIG.QWEN.TYPE) {
        // ===== Qwen 流程 =====
        const { messages, cursorContext: ctx } = buildQwenMessages(fileContent, qwenFimBuilder, fimMetadata)
        cursorContext = ctx

        completionText = await callQwenAPI(
          messages,
          {
            model: completeModel,
            maxTokens: calculateTokens(ctx),
            stopSequences: getStopSequences(ctx, modelType)
          },
          apiKey,
          baseUrl
        )
      } else {
        // ===== DeepSeek 流程（使用 FIM API） =====
        const {
          prompt,
          suffix,
          cursorContext: ctx
        } = buildDeepSeekFIMParams(fileContent, deepseekFimBuilder, fimMetadata)
        cursorContext = ctx

        completionText = await callDeepSeekAPI(
          prompt,
          suffix,
          {
            model: completeModel,
            maxTokens: calculateTokens(ctx),
            stopSequences: getStopSequences(ctx, modelType)
          },
          apiKey,
          baseUrl
        )
      }

      // 7. 处理补全结果
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
