import {
  getCurrentSelectedNode,
  getPageSchema,
  queryNodeById,
  delNode,
  addNode,
  changeNodeProps,
  selectSpecificNode,
  EditPageSchema
} from './tools'
import resourcesExport from './resources'

export default {
  tools: [
    getCurrentSelectedNode,
    getPageSchema,
    queryNodeById,
    delNode,
    addNode,
    changeNodeProps,
    selectSpecificNode,
    EditPageSchema
  ],
  resources: resourcesExport.resources,
  resourceTemplates: resourcesExport.resourceTemplates
}
