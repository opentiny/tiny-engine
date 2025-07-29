import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the page'),
  name: z.string().describe('The name of the page. The name must be unique and Capitalize the first letter.'),
  route: z.string().describe('The route of the page'),
  parentId: z
    .string()
    .optional()
    .describe(
      'The parent id of the page, if not provided, the page will be created at the root level. if provided, the page will be created at the specified parent id.'
    )
})

export const changePageBasicInfo = {
  name: 'change_page_basic_info',
  label: 'Change Page Basic Info',
  order: 8,
  description:
    'Change a page basic info from the current TinyEngine low-code application. Use this when you need to change a page from your application.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id, name, route, parentId } = args

    const { updatePageById } = usePage()
    const { success, error } = await updatePageById(id, { id, name, route, parentId })

    if (!success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: error
            })
          }
        ]
      }
    }

    const res = {
      status: 'success',
      message: `Page updated successfully`,
      data: {
        id,
        name,
        route,
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
