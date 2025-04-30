import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the node to change the props of.'),
  props: z
    .object({})
    .describe(
      'The props of the component. if you don\'t know available props, you can use the "get_component_detail" tool to get component detail and available props.'
    ),
  overwrite: z.boolean().optional().describe('Whether to overwrite the existing props.')
})

export const changeNodeProps = {
  name: 'change_node_props',
  description:
    'Change the props of a node in the current TinyEngine low-code application. Use this when you need to change the props of a node in your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id, overwrite = false } = args
    let props = args.props

    if (!id) {
      throw new Error('Id is required')
    }

    if (!props || typeof props !== 'object') {
      props = {}
    }

    useCanvas().operateNode({
      type: 'changeProps',
      id,
      value: { props },
      option: {
        overwrite
      }
    })

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Node props changed successfully`,
            data: {
              id,
              props
            }
          }
        }
      ]
    }
  }
}
