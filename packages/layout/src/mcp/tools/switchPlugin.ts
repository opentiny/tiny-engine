import { z } from 'zod'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  pluginId: z.string().describe('The id of the plugin to operate.'),
  operation: z.enum(['open', 'close']).describe('The operation to perform on the plugin.')
})

export const switchPluginPanel = {
  name: 'switch_plugin_panel',
  description:
    'Switch to the current TinyEngine low-code application. Use this when you need to switch to the current TinyEngine low-code application.',
  inputSchema: inputSchema.shape,
  callback: async (_args: z.infer<typeof inputSchema>) => {
    const { pluginId, operation } = _args
    const { activePlugin, closePlugin } = useLayout()

    if (operation === 'open' && pluginId) {
      await activePlugin(pluginId)
    } else {
      await closePlugin()
    }

    const res = {
      status: 'success',
      message: `Plugin panel switched successfully`,
      data: {}
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
