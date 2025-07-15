import { z } from 'zod'
import useTranslate from '../useTranslate'
import { validateParams, commonValidationRules } from './validateParams'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 定义为普通对象，用于传递给 inputSchema 字段
const inputSchema = {
  key: z.string().describe('The unique key for the i18n entry to delete, e.g. lowcode.36223242')
}

// 输出schema定义 - 使用通用的schema基础结构
const outputSchema = createOutputSchema({
  type: 'object',
  properties: {
    key: { type: 'string' },
    deletedEntry: {
      type: 'object',
      description: 'The deleted i18n entry data'
    }
  },
  description: 'The deleted i18n entry information'
})

// 用于类型推断的 z.object 包装版本
const _inputSchemaObject = z.object(inputSchema)

export const delI18n = {
  name: 'delete_i18n',
  description:
    'Delete an i18n entry from the current TinyEngine low-code application by its key. Use this when you need to remove internationalization translations.',
  inputSchema,
  outputSchema, // 新增：定义输出结构
  annotations: {
    title: 'Delete I18n Entry',
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof _inputSchemaObject> & { toolCallId: string }) => {
    const { key } = args

    // 使用通用验证方法进行参数验证
    const validationResult = validateParams(args, {
      key: commonValidationRules.requiredKey
    })

    if (!validationResult.isValid) {
      // 直接返回验证错误，已经符合新的结构化格式
      return validationResult.error!
    }

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
