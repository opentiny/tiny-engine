import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { getAllPages } from './get_all_pages_utils'

const inputSchema = z.object({
  id: z
    .string()
    .describe(
      'The id of the page. if you don\'t know the id, you can use the tool "get_page_list" to get the page list.'
    )
})

export const editSpecificPage = {
  name: 'edit_page_in_canvas',
  title: '在画布中编辑页面',
  order: 9,
  description: 'Edit a specific page in canvas. Use this tool when you need to edit some page in canvas.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const { switchPage } = usePage()
    const allPages = await getAllPages()
    const page = allPages.find((page) => String(page.id) === String(id))

    if (!page) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              errorCode: 'PAGE_NOT_FOUND',
              reason: `Unknown pageId: ${id}`,
              userMessage: `Page not found. Fetch the available page list.`,
              next_action: [
                {
                  type: 'tool_call',
                  name: 'get_page_list',
                  args: {}
                }
              ]
            })
          }
        ]
      }
    }

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
