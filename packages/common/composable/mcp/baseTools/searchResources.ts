import type { IState, ResourceItem, ResourceTemplateItem } from '../type'
import { tryFetchRemoteLists, readResourceWithFallback, calculateByteLength, truncateTextToBytes } from './utils'
import { z } from 'zod'

const inputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .describe(
      '检索关键词（必填）。用于定位最相关的资源，支持匹配资源名称、标题、描述和内容。建议使用具体的技术术语、功能名称或问题关键词，如"按钮组件"、"API文档"、"数据绑定"等。'
    ),
  scope: z
    .enum(['metadata', 'content', 'all'])
    .optional()
    .describe(
      '检索范围：metadata（仅搜索名称、标题、描述等元数据，速度快）| content（搜索文件内容，更全面但耗时）| all（默认，同时搜索元数据和内容）。首次搜索建议用metadata，未找到满意结果时升级为all。'
    ),
  type: z
    .enum(['resource', 'resource_template', 'all'])
    .optional()
    .describe(
      '限定搜索类型：resource（搜索静态资源如文档、代码）| resource_template（搜索模板资源，支持参数化）| all（默认，搜索所有类型）。明确需求类型可提高搜索精度。'
    ),
  audience: z
    .enum(['assistant', 'user', 'both'])
    .optional()
    .describe(
      '按受众筛选：assistant（搜索AI助手相关的技术文档、API参考等）| user（搜索用户界面、操作手册等）| both（默认，不限受众）。'
    ),
  mimeType: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe(
      '按文件类型筛选，支持前缀匹配。例如：text/markdown（Markdown文档）、application/json（JSON配置）、text/javascript（JS代码）。用于限定特定格式的搜索结果。'
    ),
  topK: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe(
      '返回最相关的前K个结果（1-50，默认10）。数量越多覆盖面越广但处理时间越长。建议：快速查找用5-10，全面搜索用20-30，深度研究用50。'
    ),
  snippet: z
    .object({
      enabled: z
        .boolean()
        .optional()
        .describe('是否返回匹配内容片段（默认true）。片段可帮助快速了解匹配上下文，判断是否为所需内容。'),
      maxLength: z
        .number()
        .int()
        .min(60)
        .max(600)
        .optional()
        .describe(
          '片段最大长度（60-600字符，默认240）。长度越长提供上下文越多，但响应体积越大。建议：快速预览用120-240，详细了解用300-600。'
        )
    })
    .optional()
    .describe(
      '内容片段配置。开启后在搜索结果中包含匹配的文本片段，有助于快速判断资源相关性，但会增加处理时间和响应大小。'
    ),
  contentMaxBytesPerDoc: z
    .number()
    .int()
    .min(20_000)
    .max(300_000)
    .optional()
    .describe(
      '单个文档的内容搜索字节限制（20k-300k，默认120k）。仅在scope包含content时生效。限制越高搜索越全面但性能开销越大。大文档建议用模板方式分段搜索。'
    )
})

const sliceSnippet = (text: string, q: string, max = 240) => {
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text.slice(0, max)
  const start = Math.max(0, idx - Math.floor(max / 2))
  const end = Math.min(text.length, start + max)
  return text.slice(start, end)
}

// search_resources
// - 元数据 + 轻量内容检索，返回评分与可选片段
export const createSearchResourcesTool = (state: IState) => ({
  name: 'search_resources',
  title: 'Search TinyEngine Resources',
  description: [
    '用途：**智能资源检索** - 当您有明确搜索目标时，快速找到最相关的资源',
    '',
    '最佳使用场景：',
    '• 寻找特定功能的文档或示例（如"表单验证"、"数据绑定"）',
    '• 根据技术关键词查找相关资源（如"React组件"、"API接口"）',
    '• 需要在大量资源中精确定位目标内容',
    '• 想要预览资源内容片段以判断相关性',
    '',
    '检索策略：',
    '• 智能评分：结合关键词匹配度、资源优先级进行排序',
    '• 多层搜索：支持元数据搜索（快速）和内容搜索（全面）',
    '• 上下文片段：提供匹配内容的上下文，帮助快速判断',
    '• 灵活筛选：支持按类型、受众、文件格式等维度过滤',
    '',
    '性能优化建议：',
    '• 首次搜索用 scope=metadata，速度快',
    '• 未找到满意结果时升级为 scope=all',
    '• 大型项目建议设置合适的 topK 值',
    '• 使用具体的技术术语提高搜索精度',
    '',
    '与其他工具的配合：',
    '• 搜索后使用 read_resources 获取完整内容',
    '• 结合 discover_resources 了解资源全貌',
    '• 对模板资源，可进一步使用参数化读取',
    '',
    '返回格式：{results: Array<SearchResult>, total: number}，包含评分、片段等信息'
  ].join('\n'),
  inputSchema: inputSchema.shape,
  annotations: {
    audience: ['assistant']
  },
  callback: async (args: z.infer<typeof inputSchema>, _extra: any) => {
    const {
      query,
      scope = 'all',
      type = 'all',
      audience = 'both',
      mimeType,
      topK = 10,
      snippet: snippetCfg,
      contentMaxBytesPerDoc = 120_000
    } = args

    const wantSnippet = snippetCfg?.enabled !== false
    const snippetLen = snippetCfg?.maxLength ?? 240

    // 远端优先拉取资源与模板列表，失败回退本地
    let resources: Omit<ResourceItem, 'readCallback'>[] = []
    let templates: Omit<ResourceTemplateItem, 'readTemplateCallback'>[] = []

    const { ok, resources: rr, resourceTemplates: rt } = await tryFetchRemoteLists(state)

    if (ok) {
      resources = rr
      templates = rt
    }

    if (!ok) {
      resources = state.resources || []
      templates = state.resourceTemplates || []
    }

    const entries: (
      | {
          kind: 'resource'
          item: Omit<ResourceItem, 'readCallback'>
        }
      | {
          kind: 'resource_template'
          item: Omit<ResourceTemplateItem, 'readTemplateCallback'>
        }
    )[] = []
    if (type === 'all' || type === 'resource') {
      for (const resourceItem of resources) {
        entries.push({ kind: 'resource', item: resourceItem })
      }
    }

    if (type === 'all' || type === 'resource_template') {
      for (const templateItem of templates) {
        entries.push({ kind: 'resource_template', item: templateItem })
      }
    }

    const norm = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '')
    const lowercasedQuery = norm(query)

    const passAudience = (annotation: ResourceItem['annotations'] | ResourceTemplateItem['annotations']) => {
      if (audience === 'both') {
        return true
      }

      const a = annotation?.audience

      if (!Array.isArray(a)) {
        return true
      }

      return a.includes(audience)
    }

    const passMime = (mimeTypeItem?: string) => {
      if (!mimeType) {
        return true
      }

      if (!mimeTypeItem) {
        return false
      }

      return mimeTypeItem === mimeType || mimeTypeItem.startsWith(`${mimeType}`)
    }

    type Candidate = {
      type: 'resource' | 'resource_template'
      uri?: string
      uriTemplate?: string
      name?: string
      title?: string
      description?: string
      mimeType?: string
      annotations?: ResourceItem['annotations'] | ResourceTemplateItem['annotations']
      score: number
      snippet?: string
      variables?: ResourceTemplateItem['variables']
      variablesSchemaUri?: string
    }

    const candidates: Candidate[] = []

    // 元数据打分
    const scoreMeta = (name?: string, title?: string, desc?: string) => {
      let s = 0

      if (name && norm(name).includes(lowercasedQuery)) {
        s += 2
      }

      if (title && norm(title).includes(lowercasedQuery)) {
        s += 2
      }

      if (desc && norm(desc).includes(lowercasedQuery)) {
        s += 1
      }

      return s
    }

    // 先做元数据过滤与初始评分
    for (const e of entries) {
      const entriesItem = e.item
      const kind = e.kind
      const ann = entriesItem?.annotations
      const mt = entriesItem?.mimeType

      if (!passAudience(ann)) {
        continue
      }

      if (!passMime(mt)) {
        continue
      }

      const name = entriesItem?.name
      const title = entriesItem?.title
      const description = entriesItem?.description
      const metaScore = scoreMeta(name, title, description)
      if (scope === 'metadata' || scope === 'all') {
        if (metaScore > 0) {
          candidates.push({
            type: kind,
            uri: e.kind === 'resource' ? e.item.uri : undefined,
            uriTemplate: e.kind === 'resource_template' ? e.item.uriTemplate : undefined,
            name,
            title,
            description,
            mimeType: mt,
            annotations: ann,
            score: metaScore,
            variables: kind === 'resource_template' ? e.item.variables : undefined,
            variablesSchemaUri: kind === 'resource_template' ? e.item.variablesSchemaUri : undefined
          })
        }
      } else {
        // scope === content 时，先占位，后续内容命中再补打分
        candidates.push({
          type: kind,
          uri: kind === 'resource' ? e.item.uri : undefined,
          uriTemplate: kind === 'resource_template' ? e.item.uriTemplate : undefined,
          name,
          title,
          description,
          mimeType: mt,
          annotations: ann,
          score: 0,
          variables: kind === 'resource_template' ? e.item.variables : undefined,
          variablesSchemaUri: kind === 'resource_template' ? e.item.variablesSchemaUri : undefined
        })
      }
    }

    // 内容检索：仅处理文本类型且限制读取体量
    const addContentScores = async () => {
      const isTextual = (mimeTypeItem?: string) =>
        mimeTypeItem ? mimeTypeItem.startsWith('text/') || mimeTypeItem === 'text/markdown' : true

      const readText = async (candidateItem: Candidate): Promise<string | null> => {
        try {
          if (candidateItem.type === 'resource') {
            // 使用统一的资源读取工具函数
            const readResult = await readResourceWithFallback(state, candidateItem.uri || '')
            if (!readResult.ok) return null
            const res = readResult.result

            const content = res?.contents?.[0]
            const text = content?.text
            if (typeof text !== 'string') return null
            const bytes = calculateByteLength(text)
            if (bytes > contentMaxBytesPerDoc) {
              return truncateTextToBytes(text, contentMaxBytesPerDoc)
            }
            return text
          } else {
            // 默认不对模板做内容检索
            return null
          }
        } catch {
          return null
        }
      }

      const need = candidates.filter((c) => scope !== 'metadata' && isTextual(c.mimeType))
      const concurrency = 4
      let idx = 0
      const runOne = async () => {
        while (idx < need.length) {
          const current = need[idx++]
          const text = await readText(current)
          if (!text) continue
          if (text.toLowerCase().includes(lowercasedQuery)) {
            const boost = 3
            if (wantSnippet) {
              current.snippet = sliceSnippet(text, query, snippetLen)
            }
            current.score += boost
          }
        }
      }
      const workers = Array.from({ length: Math.min(concurrency, need.length) }, () => runOne())
      await Promise.all(workers)
    }

    await addContentScores()

    // 优先级加权
    candidates.forEach((candidateItem) => {
      const priority = typeof candidateItem?.annotations?.priority === 'number' ? candidateItem.annotations.priority : 0
      candidateItem.score = candidateItem.score * (1 + priority * 0.5)
    })

    // 过滤掉 score <= 0
    const positive = candidates.filter((candidateItem) => candidateItem.score > 0)
    positive.sort((a, b) => b.score - a.score)

    const total = positive.length
    const results = positive.slice(0, topK)

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ status: 'success', data: { results, total } })
        }
      ]
    }
  }
})

export default createSearchResourcesTool
