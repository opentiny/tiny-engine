import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getCurrentSelectedNode = {
  name: 'get_current_selected_node',
  description:
    'Get the current selected node from the current TinyEngine low-code application. Use this when you need to get the current selected node from your application.',
  inputSchema: inputSchema.shape,
  // 添加 annotations 配置
  annotations: {
    title: '获取当前选中节点', // 人性化标题
    readOnlyHint: true, // 只读操作，不会修改任何状态
    openWorldHint: false // 不与外部世界交互，只在 TinyEngine 内部操作
  },
  callback: async (_args: z.infer<typeof inputSchema>) => {
    const currentSelectedNode = useCanvas().canvasApi.value?.getCurrent?.()

    // 安全检查，确保 currentSelectedNode 存在
    if (!currentSelectedNode) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'No node is currently selected'
            })
          }
        ]
      }
    }

    const { schema, parent } = currentSelectedNode

    const res = {
      status: 'success',
      message: `Current selected node retrieved successfully`,
      data: {
        currentSelectedNode: schema,
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
