import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z
    .string()
    .describe(
      'The id of the node to delete. if you don\'t know the id, you can use the tool "get_current_selected_node" to get the current selected node. or you can use the tool "get_page_schema" to get the page schema. when get the page schema, you can find the id in the "id" field.'
    )
})

export const delNode = {
  name: 'del_node',
  title: '删除节点',
  description:
    'Delete a node from the current TinyEngine low-code application. Use this when you need to delete a node from your application.',
  inputSchema: inputSchema.shape,
  // 添加 annotations 配置
  annotations: {
    title: '删除节点', // 人性化标题
    readOnlyHint: false, // 非只读操作，会删除节点
    destructiveHint: true, // 破坏性操作，会永久删除节点
    idempotentHint: true, // 幂等操作，删除同一个节点多次没有额外效果
    openWorldHint: false // 不与外部世界交互，只在 TinyEngine 内部操作
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args
    const node = useCanvas().getNodeById(id)

    if (!node) {
      return {
        content: [
          {
            type: 'json',
            value: {
              status: 'error',
              message: 'Node not found, please check the id is correct.'
            }
          }
        ]
      }
    }

    useCanvas().operateNode({
      type: 'delete',
      id
    })

    const res = {
      status: 'success',
      message: `Node deleted successfully`,
      data: {
        id
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
