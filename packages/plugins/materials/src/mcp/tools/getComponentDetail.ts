import { z } from 'zod'
import { useMaterial } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  name: z.string()
})

export const getComponentDetail = {
  name: 'get_component_detail',
  description: 'Get the detail of a component.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { name } = args
    const { getComponentDetail } = useMaterial()
    const detail = await getComponentDetail(name)

    const res = {
      status: 'success',
      message: `Component detail retrieved successfully`,
      data: detail || {}
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(res)
        }
      ]
    }
  }
}
