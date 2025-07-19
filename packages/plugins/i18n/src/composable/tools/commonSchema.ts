// 通用的 MCP 工具输出 Schema 定义
// 用于减少重复代码，提供统一的基础结构

/**
 * 基础输出 Schema - 包含所有工具共同的字段
 */
const baseOutputSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['success', 'error'],
      description: 'Operation status'
    },
    message: {
      type: 'string',
      description: 'Result message or error description'
    },
    error: {
      type: 'string',
      description: 'Error details (only present on error)'
    }
  },
  required: ['status', 'message']
} as const

/**
 * 创建带有自定义 data 字段的输出 Schema
 * @param dataSchema 自定义的 data 字段 schema 定义
 * @returns 完整的输出 Schema
 */
export function createOutputSchema(dataSchema?: Record<string, any>) {
  const schema = {
    ...baseOutputSchema,
    properties: {
      ...baseOutputSchema.properties,
      ...(dataSchema && {
        data: {
          ...dataSchema,
          description: (dataSchema as any).description || 'Operation result data (only present on success)'
        }
      })
    }
  }

  return schema
}

/**
 * 标准成功响应类型
 */
export interface SuccessResponse<T = any> {
  status: 'success'
  message: string
  data?: T
}

/**
 * 标准错误响应类型
 */
export interface ErrorResponse {
  status: 'error'
  message: string
  error: string
}

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
    structuredContent: successData
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
