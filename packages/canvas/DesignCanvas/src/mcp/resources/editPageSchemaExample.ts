import editExamplesMd from './editPageSchemaExample.md?raw'
import { pickSectionByHeading } from './utils'

// 分节枚举与标题映射（左侧为模板入参 section，右侧为文档中的中文/英文二级标题）
const EDIT_EXAMPLE_SECTION_TITLES: Record<string, string> = {
  state: 'State 示例',
  css: 'CSS 示例',
  lifeCycles: 'LifeCycles 示例',
  methods: 'Methods 示例',
  schema: '整页 Schema 示例',
  codegen: '出码示例',
  'do-dont': 'Do & Don’t'
}

// 根资源：编辑页面 Schema 的示例（整份文档）
export const editExamplesResources = [
  {
    uri: 'tinyengine://docs/edit-page-schema-examples',
    name: 'edit-page-schema-examples',
    title: '编辑页面 Schema 的示例',
    description: '围绕 edit_page_schema 工具的结构化示例与注意事项',
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant'], priority: 0.85 },
    readCallback: async () => ({
      contents: [
        {
          uri: 'tinyengine://docs/edit-page-schema-examples',
          name: 'edit-page-schema-examples.md',
          title: '编辑页面 Schema 的示例',
          mimeType: 'text/markdown',
          text: editExamplesMd
        }
      ]
    })
  }
]

// 模板资源：编辑页面 Schema 的示例（分节读取）
export const editExamplesResourceTemplates = [
  {
    uriTemplate: 'tinyengine://docs/edit-page-schema-examples/{section}',
    name: '编辑页面 Schema 的示例（分节）',
    title: '编辑页面 Schema 的示例（分节）',
    description: '按章节读取 edit_page_schema 的示例',
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant'], priority: 0.85 },
    variables: [
      {
        name: 'section',
        required: true,
        type: 'enum',
        enumValues: Object.keys(EDIT_EXAMPLE_SECTION_TITLES).map((key) => ({
          value: key,
          title: EDIT_EXAMPLE_SECTION_TITLES[key]
        }))
      }
    ],
    readTemplateCallback: async (_uri: URL, variables: Record<string, string>) => {
      const section = (variables?.section || '').toString()
      const heading = EDIT_EXAMPLE_SECTION_TITLES[section]
      if (!heading) {
        throw new Error('Invalid template parameter: section')
      }
      const text = pickSectionByHeading(editExamplesMd, heading)
      return {
        contents: [
          {
            uri: `tinyengine://docs/edit-page-schema-examples/${section}`,
            name: `edit-page-schema-examples-${section}.md`,
            title: `编辑页面 Schema 的示例 - ${heading}`,
            mimeType: 'text/markdown',
            text
          }
        ]
      }
    }
  }
]
