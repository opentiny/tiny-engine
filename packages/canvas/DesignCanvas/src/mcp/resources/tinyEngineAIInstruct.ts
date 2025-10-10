import aiInstructMd from './tinyEngineAIInstruct.md?raw'
import { pickSectionByHeading } from './utils'

// 分节枚举与标题映射（左侧为模板入参 section，右侧为文档中的中文二级标题）
const AI_INSTRUCT_SECTION_TITLES: Record<string, string> = {
  overview: '概述',
  principles: '通用操作原则',
  guides: '常见操作指南',
  'error-handling': '错误处理指南',
  'decision-tree': '决策树',
  'best-practices': '最佳实践',
  references: '资源引用'
}

// 根资源：TinyEngine 操作指南（整份文档）——仅保留简短别名
export const aiInstructResources = [
  {
    uri: 'tinyengine://docs/ai-instruct',
    name: 'ai-instruct',
    title: 'TinyEngine 操作指南',
    description: 'TinyEngine 标准操作流程与最佳实践总览',
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant', 'user'], priority: 0.9 },
    readCallback: async () => ({
      contents: [
        {
          uri: 'tinyengine://docs/ai-instruct',
          name: 'tinyEngineAIInstruct.md',
          title: 'TinyEngine 操作指南',
          mimeType: 'text/markdown',
          text: aiInstructMd
        }
      ]
    })
  }
]

// 模板资源：TinyEngine 操作指南（分节读取）——仅保留简短别名
export const aiInstructResourceTemplates = [
  {
    uriTemplate: 'tinyengine://docs/ai-instruct/{section}',
    name: 'TinyEngine 操作指南（分节）',
    title: 'TinyEngine 操作指南（分节）',
    description: '按章节读取 TinyEngine 操作指南内容',
    mimeType: 'text/markdown',
    annotations: { audience: ['assistant', 'user'], priority: 0.9 },
    variables: [
      {
        name: 'section',
        required: true,
        type: 'enum',
        enumValues: Object.keys(AI_INSTRUCT_SECTION_TITLES).map((key) => ({
          value: key,
          title: AI_INSTRUCT_SECTION_TITLES[key]
        }))
      }
    ],
    readTemplateCallback: async (_uri: URL, variables: Record<string, string>) => {
      const section = (variables?.section || '').toString()
      const heading = AI_INSTRUCT_SECTION_TITLES[section]
      if (!heading) {
        throw new Error('Invalid template parameter: section')
      }
      const text = pickSectionByHeading(aiInstructMd, heading)
      return {
        contents: [
          {
            uri: `tinyengine://docs/ai-instruct/${section}`,
            name: `ai-instruct-${section}.md`,
            title: `TinyEngine 操作指南 - ${heading}`,
            mimeType: 'text/markdown',
            text
          }
        ]
      }
    }
  }
]

export default { aiInstructResources, aiInstructResourceTemplates }
