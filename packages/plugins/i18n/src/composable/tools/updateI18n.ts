import { z } from 'zod'
import useTranslate from '../useTranslate'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段
const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry to update'),
  zh_CN: z.string().optional().describe('The Chinese translation text (optional, only update if provided)'),
  en_US: z.string().optional().describe('The English translation text (optional, only update if provided)')
})

// 定义 data 部分的 Schema（用于更新的 i18n 条目数据）
const updateI18nDataSchema = z.object({
  key: z.string().describe('The unique key of the updated entry'),
  zh_CN: z.string().describe('The updated Chinese translation text'),
  en_US: z.string().describe('The updated English translation text'),
  type: z.string().describe('The type of the entry'),
  originalEntry: z.record(z.any()).describe('The original i18n entry before update')
})

// 输出schema定义 - 使用 Zod 版本的统一输出结构
const outputSchema = createOutputSchema(updateI18nDataSchema)

export const updateI18n = {
  name: 'update_i18n',
  description:
    'Update an existing i18n entry in the current TinyEngine low-code application. Use this when you need to modify internationalization translations.',
  inputSchema: inputSchema.shape,
  outputSchema: outputSchema.shape,
  annotations: {
    title: 'Update I18n Entry',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { key, zh_CN, en_US } = args
    // 验证至少有一个翻译字段
    const translationValidation = z
      .object({
        zh_CN: z.string().optional(),
        en_US: z.string().optional()
      })
      .safeParse(args)

    if (!translationValidation.success) {
      // 直接返回验证错误，已经符合新的结构化格式
      return createErrorResponse(
        'Invalid translation fields',
        'At least one translation (zh_CN or en_US) must be provided'
      )
    }

    const { getLangs, ensureI18n } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (!langs[key]) {
      // 错误情况：key不存在 - 使用通用错误响应
      return createErrorResponse('I18n key not found', `Key "${key}" does not exist in the i18n dictionary`)
    }

    try {
      // Get existing translations
      const existingEntry = langs[key]

      // Update with new translations, keeping existing values for ones not provided
      const updatedEntry = {
        key,
        zh_CN: zh_CN || existingEntry.zh_CN,
        en_US: en_US || existingEntry.en_US,
        type: existingEntry.type
      }

      await ensureI18n(updatedEntry, true)

      // 成功情况 - 使用通用成功响应
      return createSuccessResponse('I18n entry updated successfully', {
        ...updatedEntry,
        originalEntry: existingEntry
      })
    } catch (error) {
      // 处理执行过程中的异常 - 使用通用错误响应
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return createErrorResponse('Failed to update i18n entry', errorMessage)
    }
  }
}
