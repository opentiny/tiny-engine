import { pageSchemaResources, pageSchemaResourceTemplates } from './pageSchemaProtocol'
import { editExamplesResources, editExamplesResourceTemplates } from './editPageSchemaExample'
import { aiInstructResources, aiInstructResourceTemplates } from './tinyEngineAIInstruct'

export const resources = [...pageSchemaResources, ...editExamplesResources, ...aiInstructResources]

export const resourceTemplates = [
  ...pageSchemaResourceTemplates,
  ...editExamplesResourceTemplates,
  ...aiInstructResourceTemplates
]

export default { resources, resourceTemplates }
