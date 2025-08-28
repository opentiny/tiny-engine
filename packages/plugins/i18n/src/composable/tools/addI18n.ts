import { z } from 'zod'
import useTranslate from '../useTranslate'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段
const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry, e.g. lowcode.36223242'),
  zh_CN: z.string().describe('The Chinese translation text'),
  en_US: z.string().describe('The English translation text')
})

// 定义 data 部分的 Schema（用于新增的 i18n 条目数据）
const addI18nDataSchema = z.object({
  key: z.string().describe('The unique key of the created entry'),
  zh_CN: z.string().describe('The Chinese translation text'),
  en_US: z.string().describe('The English translation text'),
  type: z.string().describe('The type of the entry')
})

// 输出schema定义 - 使用 Zod 版本的统一输出结构
const outputSchema = createOutputSchema(addI18nDataSchema)

export const addI18n = {
  name: 'add_i18n',
  description:
    'Add a new i18n entry to the current TinyEngine low-code application. Use this when you need to add new internationalization translations to your application.',
  inputSchema: inputSchema.shape,
  outputSchema: outputSchema.shape, // 使用 Zod 版本的统一输出结构
  annotations: {
    title: 'Add I18n Entry',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { key, zh_CN, en_US } = args
    const { getLangs, ensureI18n } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (langs[key]) {
      // 错误情况：key已存在 - 使用通用错误响应
      return createErrorResponse('I18n key already exists', `Key "${key}" is already defined in the i18n dictionary`)
    }

    try {
      await ensureI18n(
        {
          en_US,
          key,
          type: 'i18n',
          zh_CN
        },
        true
      )

      // 成功情况 - 使用通用成功响应
      return createSuccessResponse('I18n entry created successfully', {
        key,
        zh_CN,
        en_US,
        type: 'i18n'
      })
    } catch (error) {
      // 处理执行过程中的异常 - 使用通用错误响应
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return createErrorResponse('Failed to create i18n entry', errorMessage)
    }
  }
}
