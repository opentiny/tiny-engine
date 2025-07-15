import { z } from 'zod'
import useTranslate from '../useTranslate'
import { validateParams, validateCustom, commonValidationRules } from './validateParams'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段
const inputSchema = {
  key: z.string().describe('The unique key for the i18n entry to update, e.g. lowcode.36223242'),
  zh_CN: z.string().optional().describe('The updated Chinese translation text'),
  en_US: z.string().optional().describe('The updated English translation text')
}

// 输出schema定义 - 使用通用的schema基础结构
const outputSchema = createOutputSchema({
  type: 'object',
  properties: {
    key: { type: 'string' },
    zh_CN: { type: 'string' },
    en_US: { type: 'string' },
    type: { type: 'string' },
    originalEntry: {
      type: 'object',
      description: 'The original i18n entry before update'
    }
  },
  description: 'The updated i18n entry data'
})

// 用于类型推断的 z.object 包装版本
const _inputSchemaObject = z.object(inputSchema)

export const updateI18n = {
  name: 'update_i18n',
  description:
    'Update an existing i18n entry in the current TinyEngine low-code application. Use this when you need to modify internationalization translations.',
  inputSchema,
  outputSchema, // 新增：定义输出结构
  annotations: {
    title: 'Update I18n Entry',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof _inputSchemaObject> & { toolCallId: string }) => {
    const { key, zh_CN, en_US } = args

    // 使用通用验证方法进行参数验证
    const keyValidation = validateParams(args, {
      key: commonValidationRules.requiredKey
    })

    if (!keyValidation.isValid) {
      // 直接返回验证错误，已经符合新的结构化格式
      return keyValidation.error!
    }

    // 验证至少有一个翻译字段
    const translationValidation = validateCustom(
      args,
      (params) => Boolean(params.zh_CN || params.en_US),
      'At least one translation (zh_CN or en_US) must be provided'
    )

    if (!translationValidation.isValid) {
      // 直接返回验证错误，已经符合新的结构化格式
      return translationValidation.error!
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
