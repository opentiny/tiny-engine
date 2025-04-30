import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  name: z.string().describe('The name of the page. The name must be unique and Capitalize the first letter.'),
  route: z.string().describe('The route of the page'),
  parentId: z
    .string()
    .optional()
    .describe(
      'The parent id of the page, if not provided, the page will be created at the root level. if provided, the page will be created at the specified parent id.'
    )
})

export const addPage = {
  name: 'add_page',
  label: 'Add Page',
  order: 6,
  description:
    'Add a new page to the current TinyEngine low-code application. Use this when you need to add new page to your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { name, route, parentId } = args

    if (!name) {
      throw new Error('Name is required')
    }

    if (!route) {
      throw new Error('Route is required')
    }

    const { createNewPage } = usePage()
    const { success, data } = await createNewPage({ name, route, parentId })

    if (!success) {
      throw new Error('Failed to create page')
    }

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Page created successfully`,
            data: {
              id: data.id,
              name,
              route,
              type: 'page'
            }
          }
        }
      ]
    }
  }
}
