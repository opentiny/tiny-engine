import {
  getCurrentSelectedNode,
  getPageSchema,
  queryNodeById,
  delNode,
  addNode,
  changeNodeProps,
  selectSpecificNode
} from './tools'

export default {
  tools: [getCurrentSelectedNode, getPageSchema, queryNodeById, delNode, addNode, changeNodeProps, selectSpecificNode]
}
