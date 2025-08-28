import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the page')
})

export const editSpecificPage = {
  name: 'Edit_page_in_canvas.',
  order: 9,
  description: 'Edit a specific page in canvas. Use this tool when you need to edit some page in canvas.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const { switchPage } = usePage()

    await switchPage(id)

    const res = {
      status: 'success',
      message: `Page now can be edited.`,
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
