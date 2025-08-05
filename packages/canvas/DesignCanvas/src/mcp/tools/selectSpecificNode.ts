import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the node to select.')
})

export const selectSpecificNode = {
  name: 'select_specific_node',
  description:
    'Select a specific node from the current TinyEngine low-code application. Use this when you need to select a specific node from your application.',
  inputSchema: inputSchema.shape,
  // 添加 annotations 配置
  annotations: {
    title: '选择特定节点', // 人性化标题
    readOnlyHint: false, // 非只读操作，会改变选择状态
    destructiveHint: false, // 非破坏性操作，只是改变选择状态
    idempotentHint: false, // 非幂等操作，重复选择可能触发不同的 UI 效果
    openWorldHint: false // 不与外部世界交互，只在 TinyEngine 内部操作
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id } = args

    useCanvas().canvasApi.value?.selectNode?.(id, 'clickTree')

    const res = {
      status: 'success',
      message: `Node selected successfully`,
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
