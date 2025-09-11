import { getUtilsTool } from './tools/getUtilsTool'
import { addOrEditUtilsTool } from './tools/addOrEditUtilsTool'
import { deleteUtilsTool } from './tools/deleteUtilsTool'

export default {
  tools: [getUtilsTool, addOrEditUtilsTool, deleteUtilsTool]
}
