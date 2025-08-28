import { z } from 'zod'
import useTranslate from '../useTranslate'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段，key是可选的
const inputSchema = z.object({
  key: z
    .string()
    .optional()
    .describe(
      'The unique key for the i18n entry to retrieve (optional). If provided, returns specific entry; if omitted, returns all entries.'
    )
})

// 定义 data 部分的 Schema（用于 i18n 条目数据）
const i18nDataSchema = z.object({
  entries: z.record(z.any()).describe('I18n entries object containing key-value pairs'),
  count: z.number().describe('Total number of entries returned')
})

// 输出schema定义 - 使用 Zod 版本的统一输出结构
const outputSchema = createOutputSchema(i18nDataSchema)

export const getI18n = {
  name: 'get_i18n',
  description:
    'Retrieve i18n entries from the current TinyEngine low-code application. Can get a specific entry by key or all entries if no key is provided.',
  inputSchema: inputSchema.shape,
  outputSchema: outputSchema.shape, // 使用 Zod 版本的统一输出结构
  annotations: {
    title: 'Get I18n Entries',
    readOnlyHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { key } = args

    try {
      const { getLangs } = useTranslate()
      const langs = getLangs() as Record<string, any>

      // 如果提供了key，返回特定的i18n条目（仍使用统一格式）
      if (key) {
        if (!langs[key]) {
          // 错误情况：指定的key不存在
          return createErrorResponse('I18n key not found', `Key "${key}" does not exist in the i18n dictionary`)
        }

        // 成功情况：返回指定的条目，使用统一的entries格式
        const singleEntryData = {
          entries: { [key]: langs[key] },
          count: 1
        }

        return createSuccessResponse(`I18n entry for key "${key}" retrieved successfully`, singleEntryData)
      }

      // 如果没有提供key，返回所有i18n条目
      const entryCount = Object.keys(langs).length

      if (!entryCount) {
        // 成功情况：但没有找到任何条目
        return createSuccessResponse('No i18n entries found', {
          entries: {},
          count: 0
        })
      }

      // 成功情况：返回所有条目
      const res = createSuccessResponse(`Retrieved ${entryCount} i18n entries`, {
        entries: langs,
        count: entryCount
      })

      return res
    } catch (error) {
      // 处理执行过程中的异常
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return createErrorResponse('Failed to retrieve i18n entries', errorMessage)
    }
  }
}
