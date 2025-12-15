import agentPrompt from './templates/agent-prompt.md?raw'
import chatPrompt from './templates/chat-prompt.md?raw'
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
      return `${header}\n\`\`\`json\n${patchContent}\n\`\`\``
    })
    .join('\n\n')
}

type ComponentMaterial = {
  component: string
  name: { zh_CN: string; en_US?: string }
  props: Array<{
    property: string
    description?: { zh_CN: string; en_US?: string }
    type: string
    defaultValue?: any
  }>
  events: Array<{
    name: string
    description?: { zh_CN: string; en_US?: string }
  }>
  slots: Array<{
    name: string
    description?: { zh_CN: string; en_US?: string }
  }>
}

const toPascalCase = (str: string): string => {
  if (!str.toLowerCase().startsWith('tiny')) return str
  const result = str
    .replace(/[-_]([a-z])/g, (_: string, char: string) => char.toUpperCase())
    .replace(/^[a-z]/, (firstChar: string) => firstChar.toUpperCase())
  return result
}

const nativeComponents = [
  'p',
  'a',
  'hr',
  'img',
  'h1',
  'video',
  'button',
  'input',
  'form',
  'form-item',
  'select',
  'table',
  'container',
  'text',
  'image'
]

export const formatComponents = (snippets: any[], getComponent: (name: string) => ComponentMaterial): any[] => {
  const ignoreGroups = ['model', 'element-plus']
  const ignoreComponents = [
    ...nativeComponents,
    'Box',
    'CanvasRowColContainer',
    'CanvasFlexBox',
    'CanvasSection',
    'Collection',
    'CanvasNavigation',
    'TinyButtons',
    'TinyCheckboxbuttonGroup',
    'TinyNumeric' // 组件报错，先忽略
  ]
  const ignoreProperties = ['id', 'className', 'ref', 'attributes3']

  const newComponents = snippets
    .filter((item: any) => !ignoreGroups.includes(item.group))
    .map((group) => group.children)
    .flat()
    .filter((item: any) => item.snippetName && !ignoreComponents.includes(item.snippetName))
    .map((child) => {
      const component: ComponentMaterial = getComponent(toPascalCase(child.snippetName))
      const schema: any = {}

      if (component?.props?.length) {
        schema.properties = component.props
          ?.filter((prop) => !ignoreProperties.includes(prop.property))
          .map((prop) => ({
            name: prop.property,
            description: prop.description?.en_US || prop.description?.zh_CN || '',
            type: prop.type || 'string',
            ...(prop.defaultValue === undefined ? {} : { default: prop.defaultValue })
          }))
          .reduce((acc: Record<string, any>, cur) => {
            const type = cur.type && cur.type.toUpperCase() !== 'STRING' ? `(${cur.type})` : ''
            const defaultValue =
              cur.default !== undefined && cur.default !== '' ? `(defaultValue: ${JSON.stringify(cur.default)})` : ''
            acc[cur.name] = `${cur.description}${type}${defaultValue}`
            return acc
          }, {})
      }

      if (component?.events?.length) {
        schema.events = component.events
          .map((event) => ({
            name: event.name,
            description: event.description?.en_US || event.description?.zh_CN || ''
          }))
          .reduce((acc: Record<string, any>, cur) => {
            acc[cur.name] = cur.description
            return acc
          }, {})
      }
      if (component?.slots?.length) {
        schema.slots = component.slots
          .map((slot) => ({
            name: slot.name,
            description: slot.description?.en_US || slot.description?.zh_CN || ''
          }))
          .reduce((acc: Record<string, any>, cur) => {
            acc[cur.name] = cur.description
            return acc
          }, {})
      }

      return {
        component: toPascalCase(child.snippetName),
        name: child.name?.zh_CN || child.name || toPascalCase(child.snippetName),
        ...schema,
        demo: child.schema
      }
    })
  return newComponents
}

/**
 * Generate agent system prompt with dynamic components and examples
 */
export const getAgentSystemPrompt = (
  components: any[],
  currentPageSchema: object,
  referenceContext: string,
  imageAssets: any[]
) => {
  const componentsList = formatComponentsToJsonl(components)

  const examplesSection = formatExamples(examplesData)

  const currentPageSchemaStr = JSON.stringify(currentPageSchema)

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
