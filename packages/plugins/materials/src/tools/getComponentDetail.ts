import { z } from 'zod'
import { useMaterial } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  name: z.string()
})

export const getComponentDetail = {
  name: 'get_component_detail',
  description: 'Get the detail of a component.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { name } = args

    if (!name) {
      throw new Error('Name is required')
    }

    const { getComponentDetail } = useMaterial()

    const detail = await getComponentDetail(name)

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Component detail retrieved successfully`,
            data: detail || {}
          }
        }
      ]
    }
  }
}
