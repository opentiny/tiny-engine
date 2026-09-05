import systemPrompt from './system-prompt.md?raw'
import pageSchemaProtocol from './pageSchemaProtocol.md?raw'
import designGuide from './designGuide.md?raw'

export const getSystemPrompt = () => {
  return systemPrompt.replace('${{pageSchemaProtocol}}', pageSchemaProtocol).replace('${{designGuide}}', designGuide)
}
