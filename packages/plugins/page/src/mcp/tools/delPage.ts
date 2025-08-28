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

export const delPage = {
  name: 'del_page',
  label: 'Delete Page',
  title: '删除页面',
  order: 7,
  description:
    'Delete a page from the current TinyEngine low-code application. Use this when you need to delete a page from your application.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const allPages = await getAllPages()
    const page = allPages.find((page) => page.id === id)

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
