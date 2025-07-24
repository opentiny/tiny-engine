import { z } from 'zod'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getAllPlugins = {
  name: 'get_all_plugins',
  description: 'Get all plugins',
  inputSchema,
  callback: async (_args: z.infer<typeof inputSchema>) => {
    const { getAllPlugins } = useLayout()
    const plugins = await getAllPlugins()

    const res = {
      status: 'success',
      message: 'Get all plugins successfully',
      data: plugins
    }

    return {
      content: [
        {
          type: 'text',
          value: JSON.stringify(res)
        }
      ]
    }
  }
}
