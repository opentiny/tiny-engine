import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().optional().describe('可选。若提供则返回指定 id 的全局状态；不提供则返回全量')
})

export const getGlobalState = {
  name: 'get_global_state',
  title: '查询全局变量',
  description: 'Query global states. When id is provided, return the specific item; otherwise return the full list.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args || {}
    const apis = getMetaApi(META_SERVICE.GlobalStateService)

    if (!apis) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              error: 'SERVICE_UNAVAILABLE',
              message: 'GlobalStateService not registered'
            })
          }
        ]
      }
    }

    const { getGlobalState: listGlobalState, getGlobalStateById } = apis

    try {
      if (!id) {
        const list = listGlobalState()
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'Global state list fetched successfully',
                data: list
              })
            }
          ]
        }
      }

      const item = getGlobalStateById(id)
      if (!item) {
        return {
          content: [
            {
              isError: true,
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: `Unknown id: ${id}`,
                error: 'GLOBAL_STATE_NOT_FOUND',
                next_action: [
                  {
                    type: 'tool_call',
                    name: 'get_global_state',
                    args: {}
                  }
                ]
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
              message: 'Global state fetched successfully',
              data: item
            })
          }
        ]
      }
    } catch (error) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'Failed to get global state',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
          }
        ]
      }
    }
  }
}
