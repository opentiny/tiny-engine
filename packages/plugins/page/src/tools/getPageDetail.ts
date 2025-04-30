import { z } from 'zod'
import { fetchPageDetail } from '../http'

const inputSchema = z.object({
  id: z.string().describe('The id of the page')
})

export const getPageDetail = {
  name: 'get_page_detail',
  label: 'Get Page Detail',
  order: 8,
  description:
    'Get a page detail from the current TinyEngine low-code application. Use this when you need to get a page detail from your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { id } = args

    if (!id) {
      throw new Error('Id is required')
    }

    const data = await fetchPageDetail(id)

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Page detail fetched successfully`,
            data
          }
        }
      ]
    }
  }
}
