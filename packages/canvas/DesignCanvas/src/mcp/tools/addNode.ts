import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { validateParams } = utils

type NodeSchema = z.ZodObject<{
  componentName: z.ZodString
  props: z.ZodObject<Record<string, z.ZodTypeAny>, 'strip', z.ZodTypeAny>
  children: z.ZodArray<z.ZodLazy<any>, 'many'>
}>

// eslint-disable-next-line @typescript-eslint/no-use-before-define
const nodeArraySchema = z.lazy(() => nodeSchema)

const nodeSchema: NodeSchema = z.object({
  componentName: z.string().describe('The name of the component.'),
  props: z.object({}).describe('The props of the component.'),
  children: z.array(z.lazy(() => nodeArraySchema)).describe('The children of the component')
})

const inputSchema = z.object({
  parentId: z
    .string()
    .optional()
    .describe(
      'The id of the parent node. If not provided, the new node will be added to the root. if you don\'t know the parentId, you can use the tool "get_page_schema" to get the page schema. if you want to add to page root, just don\'t provide the parentId.'
    ),
  newNodeData: z.lazy(() => nodeSchema).describe('The new node data.'),
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
      componentName: {
        required: true,
        message:
          'Component name is required, if you don\'t know the component name, you can use the tool "get_component_list" to get the component detail.'
      },
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

    useCanvas().operateNode({
      type: 'insert',
      parentId: parentId!,
      // @ts-ignore
      newNodeData: {
        componentName,
        props,
        children
      },
      position: position!,
      referTargetNodeId
    })

    const res = {
      status: 'success',
      message: `Node added successfully`,
      data: {
        componentName,
        props,
        children
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
