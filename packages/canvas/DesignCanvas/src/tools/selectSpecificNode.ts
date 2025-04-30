import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the node to select.')
})

export const selectSpecificNode = {
  name: 'select_specific_node',
  description:
    'Select a specific node from the current TinyEngine low-code application. Use this when you need to select a specific node from your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      throw new Error('Id is required')
    }

    useCanvas().canvasApi.value?.selectNode(id, 'clickTree')

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Node selected successfully`,
            data: {
              id
            }
          }
        }
      ]
    }
  }
}
