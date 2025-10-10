import pageSchemaMd from './pageSchema.md?raw'
import { pickSectionByHeading } from './utils'

// 分节枚举与标题映射（左侧为模板入参 section，右侧为文档中的中文/英文二级标题）
// 注意：这些映射用于在原始 markdown 文本中定位对应章节，务必与文档内标题保持一致
const PAGE_SCHEMA_SECTION_TITLES: Record<string, string> = {
  overview: '概览',
  structure: 'structure',
  state: 'State',
  css: 'CSS',
  lifeCycles: 'LifeCycles',
  methods: 'Methods',
  children: 'Children',
  props: 'Props 绑定与特殊协议'
}

// 根资源：页面 Schema 协议（整份文档）
export const pageSchemaResources = [
  {
    uri: 'tinyengine://docs/page-schema',
    name: 'page-schema',
    title: '页面 Schema 协议',
    description: `TinyEngine 页面 Schema 字段说明、用途、约束与示例

章节概览：
• 概览：页面 schema 的基本概念和数据模型介绍
• structure：页面 schema 接口定义和核心字段说明
• State：页面状态管理，支持字面量、表达式、计算属性等
• CSS：页面样式定义，等同于 Vue 单文件的 style 标签
• LifeCycles：生命周期钩子函数，如 setup、onMounted 等
• Methods：页面方法定义，支持函数绑定和调用
• Children：节点树结构，支持条件渲染和循环渲染
• Props 绑定与特殊协议：属性绑定规则，包括 v-model、i18n、函数绑定等`,
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant', 'user'], priority: 0.95 },
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
    description: `按章节读取TinyEngine 页面 Schema 协议内容
章节概览：
• 概览：页面 schema 的基本概念和数据模型介绍
• structure：页面 schema 接口定义和核心字段说明
• State：页面状态管理，支持字面量、表达式、计算属性等
• CSS：页面样式定义，等同于 Vue 单文件的 style 标签
• LifeCycles：生命周期钩子函数，如 setup、onMounted 等
• Methods：页面方法定义，支持函数绑定和调用
• Children：节点树结构，支持条件渲染和循环渲染
• Props 绑定与特殊协议：属性绑定规则，包括 v-model、i18n、函数绑定等`,
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant', 'user'], priority: 0.95 },
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
