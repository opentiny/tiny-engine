import pageSchemaMd from './pageSchema.md?raw'
import { pickSectionByHeading } from './utils'

// 分节枚举与标题映射（左侧为模板入参 section，右侧为文档中的中文/英文二级标题）
// 注意：这些映射用于在原始 markdown 文本中定位对应章节，务必与文档内标题保持一致
const PAGE_SCHEMA_SECTION_TITLES: Record<string, string> = {
  overview: '概览',
  fields: '字段',
  state: 'State',
  css: 'CSS',
  lifeCycles: 'LifeCycles',
  methods: 'Methods',
  children: 'Children',
  'schema-merge': 'Schema 合并策略',
  pitfalls: '常见陷阱',
  faq: 'FAQ'
}

// 根资源：页面 Schema 协议（整份文档）
export const pageSchemaResources = [
  {
    uri: 'tinyengine://docs/page-schema',
    name: 'page-schema',
    title: '页面 Schema 协议',
    description: 'TinyEngine 页面 Schema 字段说明、用途、约束与最佳实践',
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant'], priority: 0.95 },
    readCallback: async () => ({
      contents: [
        {
          uri: 'tinyengine://docs/page-schema',
          name: 'page-schema.md',
          title: '页面 Schema 协议',
          mimeType: 'text/markdown',
          text: pageSchemaMd
        }
      ]
    })
  }
]

// 模板资源：页面 Schema 协议（分节读取）
export const pageSchemaResourceTemplates = [
  {
    uriTemplate: 'tinyengine://docs/page-schema/{section}',
    name: '页面 Schema 协议（分节）',
    title: '页面 Schema 协议（分节）',
    description: '按章节读取页面 Schema 协议内容',
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant'], priority: 0.95 },
    variables: [
      {
        name: 'section',
        required: true,
        type: 'enum',
        enumValues: Object.keys(PAGE_SCHEMA_SECTION_TITLES).map((key) => ({
          value: key,
          title: PAGE_SCHEMA_SECTION_TITLES[key]
        }))
      }
    ],
    readTemplateCallback: async (_uri: URL, variables: Record<string, string>) => {
      const section = (variables?.section || '').toString()
      const heading = PAGE_SCHEMA_SECTION_TITLES[section]
      if (!heading) {
        throw new Error('Invalid template parameter: section')
      }
      const text = pickSectionByHeading(pageSchemaMd, heading)
      return {
        contents: [
          {
            uri: `tinyengine://docs/page-schema/${section}`,
            name: `page-schema-${section}.md`,
            title: `页面 Schema 协议 - ${heading}`,
            mimeType: 'text/markdown',
            text
          }
        ]
      }
    }
  }
]
