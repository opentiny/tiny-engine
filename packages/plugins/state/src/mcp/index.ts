import { getGlobalState } from './tools/getGlobalState'
import { addOrModifyGlobalState } from './tools/addOrModifyGlobalState'
import { deleteGlobalState } from './tools/deleteGlobalState'

export default {
  tools: [getGlobalState, addOrModifyGlobalState, deleteGlobalState]
}
