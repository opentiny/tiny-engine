import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({})

export const getPageSchema = {
  name: 'get_page_schema',
  description:
    'Get current editing page schema from the current TinyEngine low-code application. Use this when you need to get current editing page schema from your application.',
  inputSchema: inputSchema.shape,
  // 添加 annotations 配置
  annotations: {
    title: '获取页面结构', // 人性化标题
    readOnlyHint: true, // 只读操作，不会修改任何状态
    openWorldHint: false // 不与外部世界交互，只在 TinyEngine 内部操作
  },
  callback: async (_args: z.infer<typeof inputSchema>) => {
    const pageSchema = useCanvas().getSchema()

    const res = {
      status: 'success',
      message: `Page schema retrieved successfully`,
      data: {
        pageSchema
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
