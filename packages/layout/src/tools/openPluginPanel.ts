import { z } from 'zod'
import { META_APP as PLUGIN_NAME, useLayout } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the plugin')
})

export const openPluginPanel = {
  name: 'open_plugin_panel',
  order: 6,
  description:
    "Open a plugin panel to the current TinyEngine low-code application. Use this when you need to open a plugin panel to your application. if you don't know the id of the plugin, you can use the getAllPlugins tool to get all plugins and then find the id of the plugin.",
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      return {
        content: [
          {
            type: 'json',
            value: {
              status: 'error',
              message:
                "Id is required. Please provide the id of the plugin you want to open. If you don't know the id of the plugin, you can use the getAllPlugins tool to get all plugins and then find the id of the plugin."
            }
          }
        ]
      }
    }

    if (!Object.values(PLUGIN_NAME).includes(id)) {
      return {
        content: [
          {
            type: 'json',
            value: {
              status: 'error',
              message: `Plugin ${id} not found. Please provide a valid plugin id. If you don't know the id of the plugin, you can use the getAllPlugins tool to get all plugins and then find the id of the plugin.`
            }
          }
        ]
      }
    }

    const { activePlugin } = useLayout()
    await activePlugin(id)

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Plugin panel opened successfully`,
            data: {
              id,
              type: 'plugin'
            }
          }
        }
      ]
    }
  }
}
