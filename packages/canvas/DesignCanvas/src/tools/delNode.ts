import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the node to delete.')
})

export const delNode = {
  name: 'del_node',
  description:
    'Delete a node from the current TinyEngine low-code application. Use this when you need to delete a node from your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      throw new Error('Id is required')
    }

    const node = useCanvas().getNodeById(id)

    if (!node) {
      return {
        content: [
          {
            type: 'json',
            value: {
              status: 'error',
              message: 'Node not found, please check the id is correct.'
            }
          }
        ]
      }
    }

    useCanvas().operateNode({
      type: 'delete',
      id
    })

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Node deleted successfully`,
            data: {
              id
            }
          }
        }
      ]
    }
  }
}
