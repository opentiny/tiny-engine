/**
 * 验证结果类型 - 更新以支持结构化内容
 */
export interface ValidationResult {
  isValid: boolean
  error?: {
    content: Array<{
      type: 'text'
      text: string
    }>
    structuredContent?: {
      status: 'error'
      message: string
      error: string
    }
  }
}

/**
 * 验证规则类型
 */
export interface ValidationRule {
  required?: boolean // 是否必填
  message?: string // 自定义错误信息
  validator?: (value: any) => boolean // 自定义验证函数
}

/**
 * 验证配置类型
 */
export type ValidationConfig = Record<string, ValidationRule>

/**
 * 创建标准错误响应 - 符合 MCP 协议的结构化内容规范
 * @param message 错误信息
 * @returns 标准错误响应格式
 */
export function createErrorResponse(message: string) {
  const errorData = {
    status: 'error' as const,
    message: 'Validation failed',
    error: message
  }

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

/**
 * 验证单个字段
 * @param fieldName 字段名
 * @param value 字段值
 * @param rule 验证规则
 * @returns 验证结果
 */
export function validateField(fieldName: string, value: any, rule: ValidationRule): ValidationResult {
  // 检查必填字段
  if (rule.required && (!value || value === '')) {
    const message = rule.message || `${fieldName} is required`
    return {
      isValid: false,
      error: createErrorResponse(message)
    }
  }

  // 执行自定义验证器
  if (rule.validator && value && !rule.validator(value)) {
    const message = rule.message || `${fieldName} validation failed`
    return {
      isValid: false,
      error: createErrorResponse(message)
    }
  }

  return { isValid: true }
}

/**
 * 验证多个参数
 * @param params 要验证的参数对象
 * @param config 验证配置
 * @returns 验证结果
 */
export function validateParams(params: Record<string, any>, config: ValidationConfig): ValidationResult {
  for (const [fieldName, rule] of Object.entries(config)) {
    const result = validateField(fieldName, params[fieldName], rule)
    if (!result.isValid) {
      return result
    }
  }

  return { isValid: true }
}
