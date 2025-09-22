import {
  getCurrentSelectedNode,
  getPageSchema,
  queryNodeById,
  delNode,
  addNode,
  changeNodeProps,
  selectSpecificNode
} from './tools'
import resourcesExport from './resources'

export default {
  tools: [getCurrentSelectedNode, getPageSchema, queryNodeById, delNode, addNode, changeNodeProps, selectSpecificNode],
  resources: resourcesExport.resources,
  resourceTemplates: resourcesExport.resourceTemplates
}
