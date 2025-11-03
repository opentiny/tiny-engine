import agentPrompt from './agent-prompt-en.md?raw'
import chatPrompt from './chat-prompt.md?raw'
import componentsData from './components.json'
import examplesData from './examples.json'

/**
 * Convert components array to JSONL format string
 */
const formatComponentsToJsonl = (components: any[]): string => {
  return '```jsonl\n' + components.map((comp) => JSON.stringify(comp)).join('\n') + '\n```'
}

/**
 * Format examples object to readable text
 */
const formatExamples = (examples: Record<string, any>): string => {
  return Object.entries(examples)
    .map(([_key, example]) => {
      const { name, description, note, patch } = example
      const header = `### ${name}\n${description ? `${description}\n` : ''}${note ? `**Note**: ${note}\n` : ''}`
      const patchContent = JSON.stringify(patch)
      return `${header}\n${patchContent}`
    })
    .join('\n\n')
}

/**
 * Generate agent system prompt with dynamic components and examples
 */
export const getAgentSystemPrompt = (currentPageSchema: object, referenceContext: string, imageAssets: any[]) => {
  // Format components list
  const ignoreComponents = ['TinyNumeric'] // 组件报错，先忽略
  const componentsList = formatComponentsToJsonl(
    componentsData.filter((component) => !ignoreComponents.includes(component.component))
  )

  // Format examples section
  const examplesSection = formatExamples(examplesData)

  // Format current page schema
  const currentPageSchemaStr = JSON.stringify(currentPageSchema)

  // Replace all placeholders in the prompt template
  const prompt = agentPrompt
    .replace('{{COMPONENTS_LIST}}', componentsList)
    .replace('{{EXAMPLES_SECTION}}', examplesSection)
    .replace('{{CURRENT_PAGE_SCHEMA}}', currentPageSchemaStr)
    .replace('{{REFERENCE_KNOWLEDGE}}', referenceContext || '')
    .replace('{{IMAGE_ASSETS}}', imageAssets.map((item) => `- ![${item.describe}](${item.url})`).join('\n'))

  return prompt.trim()
}

export const getChatSystemPrompt = () => chatPrompt
