import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { validateParams } = utils

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
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { name, route, parentId } = args

    const validateResult = validateParams(args, {
      name: {
        required: true,
        message: 'Name is required'
      },
      route: {
        required: true,
        message: 'Route is required'
      }
    })

    if (!validateResult.isValid) {
      return validateResult.error
    }

    const { createNewPage } = usePage()
    const { success, data } = await createNewPage({ name, route, parentId })

    if (!success) {
      const res = {
        status: 'error',
        message: 'Failed to create page',
        data: {
          error: 'Failed to create page'
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

    const res = {
      status: 'success',
      message: `Page created successfully`,
      data: {
        id: data.id,
        name,
        route,
        type: 'page'
      }
    }

    return {
      content: [
        {
          type: 'text',
          value: JSON.stringify(res)
        }
      ]
    }
  }
}
