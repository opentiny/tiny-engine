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
// import resourcesExport from './resources'

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
  ]
  // TODO: 当前效果不佳，后续优化（大模型不会主动发现资源、读取资源）
  // resources: resourcesExport.resources,
  // resourceTemplates: resourcesExport.resourceTemplates
}
