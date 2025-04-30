import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getCurrentSelectedNode = {
  name: 'get_current_selected_node',
  description:
    'Get the current selected node from the current TinyEngine low-code application. Use this when you need to get the current selected node from your application.',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const currentSelectedNode = useCanvas().canvasApi.value?.getCurrent?.()

    const { schema, parent } = currentSelectedNode

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Current selected node retrieved successfully`,
            data: {
              currentSelectedNode: schema,
              parent
            }
          }
        }
      ]
    }
  }
}
