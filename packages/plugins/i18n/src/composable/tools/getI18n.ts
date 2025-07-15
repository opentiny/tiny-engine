import { z } from 'zod'
import useTranslate from '../useTranslate'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段，key是可选的
const inputSchema = {
  key: z
    .string()
    .optional()
    .describe(
      'The unique key for the i18n entry to retrieve (optional). If provided, returns specific entry; if omitted, returns all entries.'
    )
}

// 输出schema定义 - 使用通用的schema基础结构
const outputSchema = createOutputSchema({
  oneOf: [
    {
      type: 'object',
      description: 'Single i18n entry data when key is provided'
    },
    {
      type: 'object',
      properties: {
        entries: {
          type: 'object',
          description: 'All i18n entries when no key is provided'
        },
        count: {
          type: 'number',
          description: 'Total number of entries'
        }
      }
    }
  ],
  description: 'The retrieved i18n data'
})

// 用于类型推断的 z.object 包装版本
const _inputSchemaObject = z.object(inputSchema)

export const getI18n = {
  name: 'get_i18n',
  description:
    'Retrieve i18n entries from the current TinyEngine low-code application. Can get a specific entry by key or all entries if no key is provided.',
  inputSchema,
  outputSchema, // 新增：定义输出结构
  annotations: {
    title: 'Get I18n Entries',
    readOnlyHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof _inputSchemaObject> & { toolCallId: string }) => {
    const { key } = args

    try {
      const { getLangs } = useTranslate()
      const langs = getLangs() as Record<string, any>

      // 如果提供了key，返回特定的i18n条目
      if (key) {
        if (!langs[key]) {
          // 错误情况：指定的key不存在 - 使用通用错误响应
          return createErrorResponse('I18n key not found', `Key "${key}" does not exist in the i18n dictionary`)
        }

        // 成功情况：返回指定的条目 - 使用通用成功响应
        return createSuccessResponse('I18n entry retrieved successfully', langs[key])
      }

      // 如果没有提供key，返回所有i18n条目
      const entryCount = Object.keys(langs).length

      if (!entryCount) {
        // 成功情况：但没有找到任何条目 - 使用通用成功响应
        return createSuccessResponse('No i18n entries found', {
          entries: {},
          count: 0
        })
      }

      // 成功情况：返回所有条目 - 使用通用成功响应
      return createSuccessResponse(`Retrieved ${entryCount} i18n entries`, {
        entries: langs,
        count: entryCount
      })
    } catch (error) {
      // 处理执行过程中的异常 - 使用通用错误响应
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return createErrorResponse('Failed to retrieve i18n entries', errorMessage)
    }
  }
}
