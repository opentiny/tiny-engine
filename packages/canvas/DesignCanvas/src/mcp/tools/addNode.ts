import { z } from 'zod'
import { useCanvas, useMaterial } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { validateParams } = utils

const inputSchema = z.object({
  parentId: z
    .string()
    .optional()
    .describe(
      'The id of the parent node. If not provided, the new node will be added to the root. if you don\'t know the parentId, you can use the tool "get_page_schema" to get the page schema. if you want to add to page root, just don\'t provide the parentId.'
    ),
  newNodeData: z.object({
    componentName: z.string().describe('The name of the component.'),
    props: z.record(z.string(), z.any()).describe('The props of the component.'),
    children: z
      .array(z.record(z.string(), z.any()))
      .describe('Array of child nodes; each child has the same shape as newNodeData (recursive tree).')
  }),
  position: z
    .enum(['before', 'after'])
    .optional()
    .describe(
      'The position of the new node. If not provided, the new node will be added to the end of the parent node.'
    ),
  referTargetNodeId: z
    .string()
    .optional()
    .describe(
      'The id of the reference target node. If not provided, the new node will be added to the end of the parent node. if you don\'t know the referTargetNodeId, you can use the tool "get_page_schema" to get the page schema. if you dont want to refer to any node, just don\'t provide the referTargetNodeId.'
    )
})

export const addNode = {
  name: 'add_node',
  title: '添加节点',
  description:
    'Add a new node to the current TinyEngine low-code application. Use this when you need to add new node to your application.',
  inputSchema: inputSchema.shape,
  annotations: {
    title: '添加节点',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false
  },
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { parentId, newNodeData, position, referTargetNodeId } = args
    const componentName = newNodeData.componentName
    const { props = {}, children = [] } = newNodeData

    const validateResult = validateParams(args, {
      parentId: {
        validator: (value: string) => {
          const parentNode = useCanvas().getNodeById(value)
          return !!parentNode
        },
        message:
          'Parent node not found, please check the parentId is correct. if you don\'t know the parentId, you can use the tool "get_page_schema" to get the page schema. if you want to add to page root, just don\'t provide the parentId.'
      },
      referTargetNodeId: {
        validator: (value: string) => {
          const referTargetNode = useCanvas().getNodeById(value)
          return !!referTargetNode
        },
        message:
          "Refer target node not found, please check the referTargetNodeId is correct. if you don't want to refer to any node, just don't provide the referTargetNodeId."
      }
    })

    if (!validateResult.isValid) {
      return validateResult.error
    }

    const { getMaterial } = useMaterial()
    const material = getMaterial(componentName)
    const isEmptyPlainObject =
      material &&
      typeof material === 'object' &&
      !Array.isArray(material) &&
      Object.keys(material as Record<string, unknown>).length === 0

    if (!newNodeData.componentName || isEmptyPlainObject) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              errorCode: 'COMPONENT_NAME_REQUIRED',
              reason: 'Component name is required',
              userMessage: 'Component name is required. Fetch the available component list.',
              next_action: {
                type: 'tool_call',
                name: 'get_component_list',
                args: {}
              }
            })
          }
        ]
      }
    }

    const insertData = {
      componentName,
      props,
      children
    }

    useCanvas().operateNode({
      type: 'insert',
      parentId: parentId!,
      // @ts-ignore
      newNodeData: insertData,
      position: position!,
      referTargetNodeId
    })

    const res = {
      status: 'success',
      message: `Node added successfully`,
      data: insertData
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
