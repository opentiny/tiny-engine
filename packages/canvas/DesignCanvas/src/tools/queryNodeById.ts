import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the node to query.')
})

export const queryNodeById = {
  name: 'query_node_by_id',
  description:
    'Query a node by id from the current TinyEngine low-code application. Use this when you need to query a node by id from your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      throw new Error('Id is required')
    }

    const { node, parent } = useCanvas().getNodeWithParentById(id)

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Node retrieved successfully`,
            data: {
              node,
              parent
            }
          }
        }
      ]
    }
  }
}
