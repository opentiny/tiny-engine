import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the page')
})

export const delPage = {
  name: 'del_page',
  label: 'Delete Page',
  order: 7,
  description:
    'Delete a page from the current TinyEngine low-code application. Use this when you need to delete a page from your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      throw new Error('Id is required')
    }

    const { deletePage } = usePage()
    const { success } = await deletePage(id)

    if (!success) {
      throw new Error('Failed to delete page')
    }

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Page deleted successfully`,
            data: {
              id,
              type: 'page'
            }
          }
        }
      ]
    }
  }
}
