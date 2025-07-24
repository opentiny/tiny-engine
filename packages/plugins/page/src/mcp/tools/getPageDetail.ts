import { z } from 'zod'
import { fetchPageDetail } from '../../http'
import { utils } from '@opentiny/tiny-engine-utils'

const { validateParams } = utils

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
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args

    const validateResult = validateParams(args, {
      id: {
        required: true,
        message: 'Id is required'
      }
    })

    if (!validateResult.isValid) {
      return validateResult.error
    }

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
            value: JSON.stringify(res)
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
            value: JSON.stringify(res)
          }
        ]
      }
    }
  }
}
