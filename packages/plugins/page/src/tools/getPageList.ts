import { z } from 'zod'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getPageList = {
  name: 'get_page_list',
  label: 'Get Page List',
  order: 8,
  description:
    'Get a page list from the current TinyEngine low-code application. Use this when you need to get a page list from your application.',
  inputSchema,
  handler: async (_args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { getPageList } = usePage()
    const [firstGroup, secondGroup] = await getPageList()
    const data: any[] = []
    const getPages = (list: any[]) => {
      list.forEach((item) => {
        data.push({
          id: item.id,
          name: item.name,
          route: item.route,
          parentId: item.parentId
        })

        if (item.children) {
          getPages(item.children)
        }
      })
    }

    getPages([...firstGroup.data, ...secondGroup.data])

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Page list fetched successfully`,
            data
          }
        }
      ]
    }
  }
}
