import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.number().describe('工具类 id')
})

export const deleteUtils = {
  name: 'delete_utils',
  title: '删除工具类',
  description: '删除工具类',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const { deleteUtils, getUtilById } = getMetaApi(META_SERVICE.UseUtils)
    const utilItem = getUtilById(id)

    if (!utilItem) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'cannot find the item by id. please check the id.',
              error: 'item not found.'
            })
          }
        ]
      }
    }

    const data = await deleteUtils(id)

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            message: 'Utils tool deleted successfully',
            data
          })
        }
      ]
    }
  }
}
