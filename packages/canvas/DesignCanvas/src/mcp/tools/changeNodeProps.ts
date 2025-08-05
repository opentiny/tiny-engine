import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z.string().describe('The id of the node to change the props of.'),
  props: z
    .object({})
    .describe(
      'The props of the component. if you don\'t know available props, you can use the "get_component_detail" tool to get component detail and available props.'
    ),
  overwrite: z.boolean().optional().describe('Whether to overwrite the existing props.')
})

export const changeNodeProps = {
  name: 'change_node_props',
  description:
    'Change the props of a node in the current TinyEngine low-code application. Use this when you need to change the props of a node in your application.',
  inputSchema: inputSchema.shape,
  // 添加 annotations 配置
  annotations: {
    title: '修改节点属性', // 人性化标题
    readOnlyHint: false, // 非只读操作，会修改节点属性
    destructiveHint: false, // 非破坏性操作，只是修改属性值
    idempotentHint: false, // 非幂等操作，不同的属性修改会产生不同效果
    openWorldHint: false // 不与外部世界交互，只在 TinyEngine 内部操作
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id, overwrite = false } = args
    let props = args.props

    if (!props || typeof props !== 'object') {
      props = {}
    }

    useCanvas().operateNode({
      type: 'changeProps',
      id,
      value: { props },
      option: {
        overwrite
      }
    })

    const res = {
      status: 'success',
      message: `Node props changed successfully`,
      data: {
        id,
        props
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
