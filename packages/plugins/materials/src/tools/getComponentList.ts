import { z } from 'zod'
import { useMaterial } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getComponentList = {
  name: 'get_component_list',
  description: 'Get all components that can be dragged to the canvas in the current low-code platform application.',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { getComponentList } = useMaterial()
    const list = await getComponentList()

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Component list retrieved successfully`,
            data: list || []
          }
        }
      ]
    }
  }
}
