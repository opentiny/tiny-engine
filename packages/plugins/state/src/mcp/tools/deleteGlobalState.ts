import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('要删除的全局变量 id')
})

export const deleteGlobalState = {
  name: 'delete_global_state',
  title: '删除全局变量',
  description: 'Delete a global state item by id.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
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

    const { getGlobalStateById, deleteGlobalState: removeGlobalState } = apis

    try {
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

      await removeGlobalState(id)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: 'Global state deleted successfully',
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
              message: 'Failed to delete global state',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
          }
        ]
      }
    }
  }
}
