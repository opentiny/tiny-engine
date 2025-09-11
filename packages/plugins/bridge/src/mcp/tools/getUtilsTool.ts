import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.number().optional().describe('工具类 id'),
  name: z.string().optional().describe('工具类名称')
})

const descriptions = [
  'get utils. use this when you need to get a utils.',
  'if you want to get a utils by id, you need to provide the id of the utils.',
  'if you want to get a utils by name, you need to provide the name of the utils.',
  "if you don't provide the id or name, you will get all utils."
]

export const getUtilsTool = {
  name: 'get_utils_tool',
  title: '获取工具类',
  description: descriptions.join('\n'),
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id, name } = args
    const { getUtilById, getUtils, getUtilByName } = getMetaApi(META_SERVICE.UseUtils)

    if (!id && !name) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: 'id or name is not provided, return all utils.',
              content: getUtils()
            })
          }
        ]
      }
    }

    if (id) {
      const item = getUtilById(id)

      if (!item) {
        return {
          content: [
            {
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              content: item
            })
          }
        ]
      }
    }

    if (name) {
      const item = getUtilByName(name)

      if (!item) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: 'cannot find the item by name. please check the name.',
                error: 'item not found.'
              })
            }
          ]
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              content: item
            })
          }
        ]
      }
    }
  }
}
