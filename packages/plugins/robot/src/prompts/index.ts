import agentPrompt from './templates/agent-prompt.md?raw'
import chatPrompt from './templates/chat-prompt.md?raw'
import componentsData from './data/components.json'
import examplesData from './data/examples.json'

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

export const getJsonFixPrompt = (jsonString: string, error = '') => {
  const errorSection = error ? `## Error Message\n${error}\n\n` : ''

  return `
You are a JSON repair specialist. Fix the following invalid JSON string to create a valid JSON Patch array (RFC 6902 standard).

## JSON Patch Format Requirements:
- Array of objects, each with required "op" and "path" properties
- "op" must be one of: "add", "replace", "remove", "move", "copy", "test"
- "path" must be a JSON Pointer string (e.g., "/property", "/array/0")
- "value" is required for "add", "replace", "move", "copy", "test" operations
- "from" is required for "move", "copy" operations
- All strings must use double quotes, no trailing commas

## Example JSON Patch:
[
  { "op": "add", "path": "/children/0", "value": { ... } },
  { "op": "replace", "path": "/css", "value": "..." }
]

## Your Task:
1. Parse and fix the invalid JSON string
2. Ensure it conforms to JSON Patch format
3. Output ONLY the corrected JSON string
4. No explanations, comments, or markdown formatting

## Invalid JSON Input:
${jsonString}

${errorSection}## Output (JSON only):
`.trim()
}
