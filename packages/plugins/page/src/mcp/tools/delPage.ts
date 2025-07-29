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
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args

    const { deletePage } = usePage()
    const { success } = await deletePage(id)

    if (!success) {
      const res = {
        status: 'error',
        message: 'Failed to delete page',
        data: {
          error: 'Failed to delete page'
        }
      }

      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify(res)
          }
        ]
      }
    }

    const res = {
      status: 'success',
      message: `Page deleted successfully`,
      data: {
        id,
        type: 'page'
      }
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
