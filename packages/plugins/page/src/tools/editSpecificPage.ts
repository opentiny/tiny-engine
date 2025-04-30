import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the page')
})

export const editSpecificPage = {
  name: 'Edit specific page',
  order: 9,
  description: 'Edit a specific page in canvas. Use this tool when you need to edit a specific page in canvas.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      throw new Error('Id is required')
    }

    const { switchPage } = usePage()

    await switchPage(id)

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Page now can be edited.`,
            data: {}
          }
        }
      ]
    }
  }
}
