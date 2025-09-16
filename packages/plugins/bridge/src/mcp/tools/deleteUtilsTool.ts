import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { createErrorResponse } = utils

const inputSchema = z.object({
  id: z.number().describe('工具类 id')
})

export const deleteUtilsTool = {
  name: 'delete_utils_tool',
  title: '删除工具类',
  description: '删除工具类',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const { deleteUtils, getUtilById } = getMetaApi(META_SERVICE.UseUtils)
    const utilItem = getUtilById(id)

    if (!utilItem) {
      return createErrorResponse('cannot find the item by id. please check the id.')
    }

    try {
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
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'Failed to delete utils tool',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
          }
        ]
      }
    }
  }
}
