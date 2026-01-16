/**
 * AI 补全模块统一导出
 */
export { createCompletionHandler } from './adapters/index.js'
export { shouldTriggerCompletion } from './triggers/completionTrigger.js'
export { createSmartPrompt, FIMPromptBuilder } from './builders/index.js'
