import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { getAllPages } from './get_all_pages_utils'

const inputSchema = z.object({
  id: z
    .string()
    .describe(
      'The id of the page. if you don\'t know the id, you can use the tool "get_page_list" to get the page list.'
    ),
  name: z.string().describe('The name of the page. The name must be unique and Capitalize the first letter.'),
  route: z
    .string()
    .describe(
      'The route of the page. only allow contain english letter, number, underline, hyphen, slash, and start with english letter.'
    ),
  parentId: z
    .string()
    .optional()
    .describe(
      'The parentId under which to place the page. If omitted, the page remains at its current level. Set to "0" to move it to the root. Use "get_page_list" to discover available parent IDs.'
    )
})

export const changePageBasicInfo = {
  name: 'change_page_basic_info',
  title: '修改页面基础信息',
  order: 8,
  description:
    'Change a page basic info from the current TinyEngine low-code application. Use this when you need to change a page from your application.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id, name, route, parentId } = args
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
