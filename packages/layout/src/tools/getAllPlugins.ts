import { z } from 'zod'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getAllPlugins = {
  name: 'get_all_plugins',
  description: 'Get all plugins',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { getAllPlugins } = useLayout()
    const plugins = await getAllPlugins()

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: 'Get all plugins successfully',
            data: plugins
          }
        }
      ]
    }
  }
}
