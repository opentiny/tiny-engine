import { pageSchemaResources, pageSchemaResourceTemplates } from './pageSchemaProtocol'
import { editExamplesResources, editExamplesResourceTemplates } from './editPageSchemaExample'

export const resources = [...pageSchemaResources, ...editExamplesResources]
export const resourceTemplates = [...pageSchemaResourceTemplates, ...editExamplesResourceTemplates]

export default { resources, resourceTemplates }
