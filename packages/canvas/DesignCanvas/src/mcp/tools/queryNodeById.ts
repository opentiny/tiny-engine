import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z
    .string()
    .describe(
      'The id of the node to query. if you don\'t know the id, you can use the tool "get_current_selected_node" to get the current selected node. or you can use the tool "get_page_schema" to get the page schema. when get the page schema, you can find the id in the "id" field.'
    )
})

export const queryNodeById = {
  name: 'query_node_by_id',
  title: '根据ID查询节点',
  description:
    'Query a node by id from the current TinyEngine low-code application. Use this when you need to query a node by id from your application.',
  inputSchema: inputSchema.shape,
  // 添加 annotations 配置
  annotations: {
    title: '根据ID查询节点', // 人性化标题
    readOnlyHint: true, // 只读操作，不会修改任何状态
    openWorldHint: false // 不与外部世界交互，只在 TinyEngine 内部操作
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const result = useCanvas().getNodeWithParentById(id)

    // 安全检查，确保找到了节点
    if (!result) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              errorCode: 'NODE_NOT_FOUND',
              reason: `Node not found: ${id}`,
              userMessage: `Node not found: ${id}. Fetch the available node list.`,
              next_action: [
                {
                  type: 'tool_call',
                  name: 'get_current_selected_node',
                  args: {},
                  when: 'you want to query the current selected node'
                },
                {
                  type: 'tool_call',
                  name: 'get_page_schema',
                  args: {},
                  when: 'you want to query the node with the specified id'
                }
              ]
            })
          }
        ]
      }
    }

    const { node, parent } = result

    const res = {
      status: 'success',
      message: `Node retrieved successfully`,
      data: {
        node,
        parent
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
