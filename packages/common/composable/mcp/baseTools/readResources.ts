import type { IState } from '../type'
import { readResourceContent } from './utils'
import { z } from 'zod'

const inputSchema = z.object({
  uri: z
    .string()
    .min(1)
    .optional()
    .describe(
      '目标资源的完整URI（与 uriTemplate 二选一）。用于读取已确定的具体资源全部内容。适合从 discover_resources 或 search_resources 获得URI后的完整读取。'
    ),
  uriTemplate: z
    .string()
    .min(1)
    .optional()
    .describe(
      '资源模板URI（与 uri 二选一）。配合 variables 参数使用，可实现参数化内容读取。适合读取文档特定章节、API特定接口等分段内容，有效控制内容体积。'
    ),
  variables: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      '模板变量键值对（仅当使用 uriTemplate 时必需）。用于替换模板中的占位符生成最终URI。例如：{"section": "api", "version": "v1"}。变量值会进行URL编码确保安全性。'
    ),
  maxBytes: z
    .number()
    .int()
    .min(10_000)
    .max(1_000_000)
    .optional()
    .describe(
      '内容读取字节上限（10k-1000k，默认200k）。用于防止读取超大文件导致性能问题。建议根据用途设置：快速预览用50k-100k，详细分析用200k-500k，完整处理用1000k。'
    ),
  truncate: z
    .boolean()
    .optional()
    .describe(
      '超出大小限制时是否允许截断（默认true）。true时返回截断内容并标记truncated=true；false时超限将报错。建议大多数场景保持true，避免因文件过大导致读取失败。'
    )
})

// read_resources
// - 读取指定资源内容；支持通过模板 + variables 读取分节/参数化内容
export const createReadResourcesTool = (state: IState) => ({
  name: 'read_resources',
  title: 'Read TinyEngine Resource(s)',
  description: [
    '用途：**精确内容读取** - 在确定目标资源后，获取完整或参数化的资源内容',
    '',
    '最佳使用场景：',
    '• 从 search_resources 或 discover_resources 找到目标后读取完整内容',
    '• 使用资源模板读取特定章节或参数化内容',
    '• 需要获取代码示例、文档详情、配置文件等具体内容',
    '• 在有明确资源URI的情况下直接读取',
    '',
    '两种读取模式：',
    '**直接读取（uri）**：',
    '  • 适用于已知具体资源地址的情况',
    '  • 返回资源的完整内容',
    '  • 简单直接，适合单一资源的完整获取',
    '',
    '**模板读取（uriTemplate + variables）**：',
    '  • 适用于参数化资源，如文档章节、API分类等',
    '  • 可精确控制读取范围，避免内容过载',
    '  • 支持动态内容生成，提高灵活性',
    '  • 推荐用于大型文档的分段读取',
    '',
    '重要限制：',
    '• 仅支持文本类型资源（text/*、application/json等）',
    '• 二进制文件（图片、视频等）不支持内容读取',
    '• 内容大小有限制，超限时可选择截断或报错',
    '',
    '错误处理：',
    '• read_resources_failed：资源读取失败（网络问题、权限等）',
    '• invalid_template_variables：模板变量缺失或格式错误',
    '• content_too_large：内容过大且不允许截断',
    '• resource_not_found：指定的资源或模板不存在',
    '',
    '性能建议：',
    '• 大文档优先使用模板方式分段读取',
    '• 根据用途设置合适的 maxBytes 限制',
    '• 保持 truncate=true 避免读取失败'
  ].join('\n'),
  inputSchema: inputSchema.shape,
  annotations: {
    audience: ['assistant']
  },
  callback: async (params: z.infer<typeof inputSchema>, _extra: any) => {
    const maxBytes = params.maxBytes ?? 200_000
    const truncate = params.truncate ?? true

    const errorContent = (text: string) => ({
      content: [{ isError: true, type: 'text' as const, text }]
    })

    const readByUri = async (uri: string) => {
      // 使用统一的资源读取工具函数
      const result = await readResourceContent(state, uri, { maxBytes, allowTruncate: truncate })
      if (!result.ok) {
        return { ok: false as const, error: result.error || 'read_resources_failed' }
      }
      return { ok: true as const, contents: result.contents, truncated: result.truncated || undefined }
    }

    try {
      if (params.uri && !params.uriTemplate) {
        const result = await readByUri(params.uri)

        if (!result.ok) {
          return errorContent(result.error)
        }

        const data = { contents: result.contents, truncated: result.truncated }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ status: 'success', data }) }]
        }
      }

      if (params.uriTemplate && !params.uri) {
        const templates = state.resourceTemplates || []
        const item = templates.find((templateItem) => templateItem.uriTemplate === params.uriTemplate)
        if (!item) {
          return errorContent('resource_not_found')
        }
        let finalUriStr = ''
        try {
          finalUriStr = item.uriTemplate.replace(/\{.+?\}/g, (m) => {
            const key = m.slice(1, -1)
            const v = (params.variables || {})[key]
            if (typeof v !== 'string' || !v) {
              throw new Error('invalid_template_variables')
            }
            return encodeURIComponent(v)
          })
        } catch (e) {
          return errorContent('invalid_template_variables')
        }

        const result = await readByUri(finalUriStr)
        if (!result.ok) return errorContent(result.error)
        const data = { contents: result.contents, truncated: result.truncated }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ status: 'success', data }) }]
        }
      }

      return errorContent('read_resources_failed')
    } catch {
      return errorContent('read_resources_failed')
    }
  }
})

export default createReadResourcesTool
