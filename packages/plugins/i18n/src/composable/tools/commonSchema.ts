// 通用的 MCP 工具输出 Schema 定义
// 用于减少重复代码，提供统一的基础结构

import { z } from 'zod'

/**
 * 基础输出 Schema - 包含所有工具共同的字段
 */
const baseOutputSchema = z.object({
  status: z.enum(['success', 'error']).describe('Operation status'),
  message: z.string().describe('Result message or error description'),
  error: z.string().optional().describe('Error details (only present on error)')
})

/**
 * 创建带有自定义 data 字段的输出 Schema（Zod 版本）
 * @param dataSchema 自定义的 data 字段 Zod schema 定义
 * @returns 完整的 Zod 输出 Schema
 */
export function createOutputSchema<T extends z.ZodTypeAny>(dataSchema?: T) {
  if (dataSchema) {
    return baseOutputSchema.extend({
      data: dataSchema.optional().describe('Operation result data (only present on success)')
    })
  }
  return baseOutputSchema
}

/**
 * 成功响应 Schema - 包含 data 字段
 */
export function createSuccessSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    status: z.literal('success'),
    message: z.string(),
    data: dataSchema
  })
}

/**
 * 错误响应 Schema
 */
export const errorSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  error: z.string()
})

/**
 * 标准成功响应类型（从 Zod schema 推断）
 */
export type SuccessResponse<T = any> = {
  status: 'success'
  message: string
  data?: T
}

/**
 * 标准错误响应类型（从 Zod schema 推断）
 */
export type ErrorResponse = z.infer<typeof errorSchema>

/**
 * 创建标准成功响应
 * @param message 成功消息
 * @param data 响应数据
 * @returns 标准成功响应格式
 */
export function createSuccessResponse<T>(message: string, data?: T) {
  const successData: SuccessResponse<T> = {
    status: 'success',
    message,
    ...(data && { data })
  }

  // 按照 MCP 协议要求，text 字段应包含与 structuredContent 功能等效的序列化内容
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(successData, null, 2)
      }
    ],
    structuredContent: JSON.parse(JSON.stringify(successData))
  }
}

/**
 * 创建标准错误响应
 * @param message 错误消息
 * @param error 具体错误详情
 * @returns 标准错误响应格式
 */
export function createErrorResponse(message: string, error: string) {
  const errorData: ErrorResponse = {
    status: 'error',
    message,
    error
  }

  // 按照 MCP 协议要求，text 字段应包含与 structuredContent 功能等效的序列化内容
  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(errorData, null, 2)
      }
    ],
    structuredContent: errorData
  }
}
