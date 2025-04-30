import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getPageSchema = {
  name: 'get_page_schema',
  description:
    'Get current editing page schema from the current TinyEngine low-code application. Use this when you need to get current editing page schema from your application.',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const pageSchema = useCanvas().getSchema()

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Page schema retrieved successfully`,
            data: {
              pageSchema
            }
          }
        }
      ]
    }
  }
}
