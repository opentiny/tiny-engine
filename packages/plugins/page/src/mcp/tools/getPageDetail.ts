import { z } from 'zod'
import { fetchPageDetail } from '../../http'

const inputSchema = z.object({
  id: z.string().describe('The id of the page')
})

export const getPageDetail = {
  name: 'get_page_detail',
  label: 'Get Page Detail',
  order: 8,
  description:
    'Get a page detail from the current TinyEngine low-code application. Use this when you need to get a page detail from your application.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args

    try {
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
          error: error?.message || ''
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
