import { z } from 'zod'
import { fetchPageDetail } from '../../http'
import { getAllPages } from './get_all_pages_utils'

const inputSchema = z.object({
  id: z
    .string()
    .describe(
      'The id of the page. if you don\'t know the id, you can use the tool "get_page_list" to get the page list.'
    )
})

export const getPageDetail = {
  name: 'get_page_detail',
  title: '获取页面详情',
  order: 8,
  description:
    'Get a page detail from the current TinyEngine low-code application. Use this when you need to get a page detail from your application.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args

    try {
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

      const data = await fetchPageDetail(id)
      const res = {
        status: 'success',
        message: `Page detail fetched successfully`,
        data
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(res)
          }
        ]
      }
    } catch (error) {
      const res = {
        status: 'error',
        message: 'Failed to fetch page detail',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
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
  }
}
