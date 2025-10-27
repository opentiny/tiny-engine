import { z } from 'zod'
import useTranslate from '../useTranslate'
import { createOutputSchema, createSuccessResponse, createErrorResponse } from './commonSchema'

// 输入 Schema：统一保存工具，支持 add / update / upsert 与合并策略
const inputSchema = z.object({
  key: z
    .string()
    .describe(
      '唯一的 i18n 键名，用于标识翻译词条。建议使用点分割命名规范，如 "common.button.save" 或 "page.user.title"'
    ),
  operation: z
    .enum(['add', 'update', 'upsert'])
    .optional()
    .describe(
      '操作模式：add=仅新增（键已存在时报错），update=仅更新（键不存在时报错），upsert=智能新增或更新（默认推荐）'
    ),
  translations: z
    .record(z.string())
    .optional()
    .describe(
      '多语言翻译映射对象，键为语言代码（如 zh_CN, en_US），值为对应翻译文本。优先级高于单独的 zh_CN/en_US 字段'
    ),
  zh_CN: z
    .string()
    .optional()
    .describe('中文翻译文本（语法糖字段）。当只需设置中文时使用，会被 translations 中的 zh_CN 覆盖'),
  en_US: z
    .string()
    .optional()
    .describe('英文翻译文本（语法糖字段）。当只需设置英文时使用，会被 translations 中的 en_US 覆盖'),
  mergeStrategy: z
    .enum(['partial', 'replace'])
    .optional()
    .describe(
      '更新现有词条时的合并策略：partial=部分更新（仅更新提供的语言，其他语言保持不变，默认），replace=替换更新（清空未提供的语言）'
    ),
  idempotent: z
    .boolean()
    .optional()
    .describe(
      '幂等模式开关。true=遇到边界冲突时静默处理不报错（如 add 已存在的键、update 不存在的键），false=严格模式会抛出错误（默认）'
    )
})

// 输出 Schema：统一数据结构
const dataSchema = z.object({
  key: z.string(),
  type: z.string(),
  translations: z.record(z.string()),
  operation: z.enum(['add', 'update', 'upsert']),
  mergeStrategy: z.enum(['partial', 'replace']),
  originalEntry: z.record(z.any()).optional(),
  noOp: z.boolean().optional()
})

const outputSchema = createOutputSchema(dataSchema)

export const saveI18n = {
  name: 'save_i18n',
  title: '保存 I18n 词条',
  description: `在当前 TinyEngine 低代码应用中创建或更新国际化（i18n）翻译词条。

适用场景：
• 添加新的多语言文本（按钮文本、提示信息、页面标题等）
• 更新现有翻译内容（修正翻译、优化措辞）
• 批量管理多语言词条（支持中英文及其他语言）

核心特性：
• 支持 add/update/upsert 三种操作模式，满足不同业务需求
• 提供 partial/replace 合并策略，灵活控制更新范围
• 内置幂等性支持，避免重复操作引起的错误
• 支持语法糖字段（zh_CN/en_US）和完整翻译映射（translations）

调用时机：
• 当需要为界面元素添加多语言支持时
• 当需要修改现有的翻译文本时
• 当需要确保翻译词条存在且内容正确时（使用 upsert 模式）`,
  inputSchema: inputSchema.shape,
  outputSchema: outputSchema.shape,
  annotations: {
    title: 'Save I18n Entry',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const {
      key,
      operation = 'upsert',
      translations: inputTranslations,
      zh_CN,
      en_US,
      mergeStrategy = 'partial',
      idempotent = false
    } = args

    try {
      const { getLangs, i18nResource, ensureI18n } = useTranslate()
      const langs = getLangs() as Record<string, any>
      const locales = (i18nResource?.locales || []).map((l: any) => l.lang)

      // 归并顶层糖衣字段到 translations，translations 优先
      const mergedInputTranslations: Record<string, string> = {
        ...(zh_CN !== undefined ? { zh_CN } : {}),
        ...(en_US !== undefined ? { en_US } : {}),
        ...(inputTranslations || {})
      }

      const existingEntry = langs[key]

      // 边界条件处理（严格模式与幂等模式）
      if (operation === 'add' && existingEntry) {
        if (idempotent) {
          return createSuccessResponse('未更改：词条已存在', {
            key,
            type: existingEntry.type || 'i18n',
            translations: Object.fromEntries(locales.map((lg) => [lg, existingEntry[lg] || ''])),
            operation: 'add',
            mergeStrategy,
            originalEntry: existingEntry,
            noOp: true
          })
        }
        return createErrorResponse('I18n 键已存在', `键 "${key}" 已在 i18n 字典中定义`)
      }

      if (operation === 'update' && !existingEntry) {
        if (idempotent) {
          return createSuccessResponse('未更改：词条不存在', {
            key,
            type: 'i18n',
            translations: Object.fromEntries(locales.map((lg) => [lg, ''])),
            operation: 'update',
            mergeStrategy,
            noOp: true
          })
        }
        return createErrorResponse('未找到 I18n 键', `键 "${key}" 不存在于 i18n 字典中`)
      }

      // 计算最终写入的 translations（保护 partial 合并不被空串覆盖）
      const baseTranslations: Record<string, string> = Object.fromEntries(
        locales.map((lg: string) => [lg, existingEntry?.[lg] ?? ''])
      )

      const finalTranslations: Record<string, string> = { ...baseTranslations }

      if (mergeStrategy === 'partial') {
        Object.entries(mergedInputTranslations).forEach(([lg, val]) => {
          if (locales.includes(lg)) finalTranslations[lg] = val
        })
      } else {
        // replace：仅对提供的语言键进行覆盖，其它语言保持原值
        Object.entries(mergedInputTranslations).forEach(([lg, val]) => {
          if (locales.includes(lg)) finalTranslations[lg] = val
        })
      }

      const finalEntry = { key, type: existingEntry?.type || 'i18n', ...finalTranslations }

      // 写入（ensureI18n 内部会根据是否存在选择 create 或 update）
      await ensureI18n(finalEntry, true)

      const resData = {
        key,
        type: finalEntry.type,
        translations: Object.fromEntries(locales.map((lg) => [lg, finalTranslations[lg] || ''])),
        operation: existingEntry ? (operation === 'add' ? 'add' : 'update') : operation === 'update' ? 'update' : 'add',
        mergeStrategy,
        ...(existingEntry ? { originalEntry: existingEntry } : {})
      }

      return createSuccessResponse('I18n 词条保存成功', resData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发生未知错误'
      return createErrorResponse('保存 i18n 词条失败', errorMessage)
    }
  }
}
