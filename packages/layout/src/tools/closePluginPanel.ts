import { z } from 'zod'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const closePluginPanel = {
  name: 'close_plugin_panel',
  order: 6,
  description:
    'Close current opened plugin panel to the current TinyEngine low-code application. Use this when you need to close current opened plugin panel.',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { closePlugin } = useLayout()
    await closePlugin()

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Plugin panel closed successfully`,
            data: {}
          }
        }
      ]
    }
  }
}
