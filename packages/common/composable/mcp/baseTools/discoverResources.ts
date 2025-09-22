import type { IState, ResourceItem, ResourceTemplateItem } from '../type'
import { tryFetchRemoteLists } from './utils'
import { z } from 'zod'

const inputSchema = z.object({
  q: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe(
      '关键词过滤（匹配 name/title/description，大小写不敏感）。用于初步缩小范围，如搜索"组件"、"API"、"文档"等。无明确主题时可不填，返回所有资源。'
    ),
  type: z
    .enum(['resource', 'resource_template', 'all'])
    .optional()
    .describe(
      '限定返回类型：resource（静态资源如文档、代码文件）| resource_template（参数化模板，支持动态内容生成）| all（默认，返回所有类型）。根据需求选择具体类型可减少无关结果。'
    ),
  audience: z
    .enum(['assistant', 'user', 'both'])
    .optional()
    .describe(
      '按目标受众过滤：assistant（AI助手专用资源，如内部文档、API参考）| user（用户相关资源，如用户手册、界面组件）| both（默认，不做受众限制）。选择 assistant 可获得更准确的技术资源。'
    ),
  mimeType: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe(
      '按文件类型过滤，支持前缀匹配。常用值：text/markdown（文档）、application/json（配置文件）、text/javascript（代码）、image/（图片）。用于限制特定格式的资源。'
    ),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe(
      '页码（从1开始）。当资源数量较多时使用分页获取，避免单次返回过多数据影响性能。通常先用默认值1获取首页结果。'
    ),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .describe(
      '每页返回数量（1-200，默认50）。数量越大单次获取越多，但响应体积也越大。建议根据实际需要调整：快速浏览用10-20，详细分析用50-100。'
    ),
  sortBy: z
    .enum(['priority', 'name'])
    .optional()
    .describe(
      '排序方式：priority（默认，按优先级降序，重要资源在前）| name（按名称字母序升序）。priority适合获取最相关资源，name适合按名称查找。'
    ),
  includeAnnotations: z
    .boolean()
    .optional()
    .describe(
      '是否包含资源注解信息（默认true）。注解包含优先级、受众等元数据，对后续决策有用。false可减少响应大小，但会丢失重要的筛选信息。'
    )
})

const defaultPageSize = 50

// - 列出当前可用资源与资源模板，支持过滤、排序、分页
export const createDiscoverResourcesTool = (state: IState) => ({
  name: 'discover_resources',
  title: 'Discover TinyEngine Resources',
  description: [
    '用途：**资源发现与导航** - 当您需要了解TinyEngine平台有哪些可用资源时的首选工具',
    '',
    '最佳使用场景：',
    '• 初次接触平台，想了解有哪些文档、组件、API等资源',
    '• 不确定具体关键词，需要浏览所有相关资源',
    '• 需要按类型、受众、优先级等维度筛选资源',
    '• 想要获取资源的概览信息（名称、描述、类型等）',
    '',
    '核心功能：',
    '• 列出所有注册的资源和资源模板，支持多维度过滤',
    '• 提供资源元数据（不读取具体内容，保持轻量级）',
    '• 支持分页处理大量资源，避免信息过载',
    '• 按优先级或名称排序，快速定位重要资源',
    '',
    '工作流建议：',
    '1. 首次调用时使用默认参数获取概览',
    '2. 根据需要使用 type、audience、mimeType 进一步筛选',
    '3. 找到感兴趣的资源后，使用 search_resources 做精确检索',
    '4. 确定目标资源后，使用 read_resources 读取具体内容',
    '',
    '性能特点：响应快速，仅返回元数据，适合高频调用',
    '',
    '返回格式：{items: Array<ResourceInfo>, page: number, pageSize: number, total: number}'
  ].join('\n'),
  inputSchema: inputSchema.shape,
  annotations: {
    audience: ['assistant']
  },
  callback: async (params: z.infer<typeof inputSchema>, _extra: any) => {
    const {
      q,
      type = 'all',
      audience = 'both',
      mimeType,
      page = 1,
      pageSize = defaultPageSize,
      sortBy = 'priority',
      includeAnnotations = true
    } = params

    // 优先从远端 mcpClient 拉取资源与模板列表，失败则回退本地快照
    let resources: Omit<ResourceItem, 'readCallback'>[] = []
    let templates: Omit<ResourceTemplateItem, 'readTemplateCallback'>[] = []

    const { ok, resources: rr, resourceTemplates: rt } = await tryFetchRemoteLists(state)
    if (ok) {
      resources = rr
      templates = rt
    }
    if (!ok) {
      resources = state?.resources || []
      templates = state?.resourceTemplates || []
    }

    type Entry = Omit<ResourceItem, 'readCallback'> | Omit<ResourceTemplateItem, 'readTemplateCallback'>
    const entries: Entry[] = []
    if (type === 'all' || type === 'resource') {
      for (const resourceItem of resources) {
        const ann = resourceItem.annotations
        entries.push({
          uri: resourceItem.uri,
          name: resourceItem.name || '',
          title: resourceItem.title,
          description: resourceItem.description,
          mimeType: resourceItem.mimeType,
          annotations: includeAnnotations ? ann : undefined
        })
      }
    }
    if (type === 'all' || type === 'resource_template') {
      for (const templateItem of templates) {
        const ann = templateItem.annotations
        entries.push({
          uriTemplate: templateItem.uriTemplate,
          name: templateItem.name,
          title: templateItem.title,
          description: templateItem.description,
          mimeType: templateItem.mimeType,
          annotations: includeAnnotations ? ann : undefined,
          variables: templateItem.variables,
          variablesSchemaUri: templateItem.variablesSchemaUri
        })
      }
    }

    const filterByAudience = (item: Entry) => {
      if (audience === 'both') return true
      const a = item?.annotations?.audience
      if (!Array.isArray(a)) return true
      return a.includes(audience)
    }

    const filterByMime = (item: Entry) => {
      if (!mimeType) return true
      if (!item?.mimeType) return false
      return item.mimeType === mimeType || item.mimeType.startsWith(`${mimeType}`)
    }

    const norm = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '')
    const qn = norm(q)
    const filterByQuery = (item: Entry) => {
      if (!q) return true
      return norm(item?.name).includes(qn) || norm(item?.title).includes(qn) || norm(item?.description).includes(qn)
    }

    const filtered = entries.filter(filterByAudience).filter(filterByMime).filter(filterByQuery)

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '')
      }
      const pa = typeof a?.annotations?.priority === 'number' ? a.annotations.priority : -1
      const pb = typeof b?.annotations?.priority === 'number' ? b.annotations.priority : -1
      if (pb !== pa) return pb - pa
      return (a.name || '').localeCompare(b.name || '')
    })

    const total = filtered.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const items = filtered.slice(start, end)

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ status: 'success', data: { items, page, pageSize, total } })
        }
      ]
    }
  }
})

export default createDiscoverResourcesTool
