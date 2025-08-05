import { z } from 'zod'
import useTranslate from '../useTranslate'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段
const inputSchema = z.object({
  key: z.string().describe('The unique key for the i18n entry to delete')
})

// 定义 data 部分的 Schema（用于删除的 i18n 条目数据）
const delI18nDataSchema = z.object({
  key: z.string().describe('The unique key of the deleted entry'),
  deletedEntry: z.record(z.any()).describe('The deleted i18n entry data')
})

// 输出schema定义 - 使用 Zod 版本的统一输出结构
const outputSchema = createOutputSchema(delI18nDataSchema)

export const delI18n = {
  name: 'delete_i18n',
  description:
    'Delete an existing i18n entry from the current TinyEngine low-code application. Use this when you need to remove internationalization translations.',
  inputSchema: inputSchema.shape,
  outputSchema: outputSchema.shape,
  annotations: {
    title: 'Delete I18n Entry',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { key } = args
    const { getLangs, removeI18n } = useTranslate()
    const langs = getLangs() as Record<string, any>

    if (!langs[key]) {
      // 错误情况：key不存在 - 使用通用错误响应
      return createErrorResponse('I18n key not found', `Key "${key}" does not exist in the i18n dictionary`)
    }

    try {
      const deletedEntry = langs[key]

      // removeI18n expects an array of keys
      ;(removeI18n as (keys: string[]) => void)([key])

      // 成功情况 - 使用通用成功响应
      return createSuccessResponse('I18n entry deleted successfully', {
        key,
        deletedEntry
      })
    } catch (error) {
      // 处理执行过程中的异常 - 使用通用错误响应
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return createErrorResponse('Failed to delete i18n entry', errorMessage)
    }
  }
}
