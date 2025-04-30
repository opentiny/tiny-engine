import { z } from 'zod'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

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
  description:
    'Add a new node to the current TinyEngine low-code application. Use this when you need to add new node to your application.',
  inputSchema,
  handler: async (args: z.infer<typeof inputSchema> & { toolCallId: string }) => {
    const { parentId, newNodeData, position, referTargetNodeId } = args
    const componentName = newNodeData.componentName
    const { props = {}, children = [] } = newNodeData

    if (!componentName) {
      return {
        content: [
          {
            type: 'json',
            value: {
              status: 'error',
              message:
                'Component name is required, if you don\'t know the component name, you can use the tool "get_component_list" to get the component detail.'
            }
          }
        ]
      }
    }

    if (parentId) {
      const parentNode = useCanvas().getNodeById(parentId)
      if (!parentNode) {
        return {
          content: [
            {
              type: 'json',
              value: {
                status: 'error',
                message:
                  'Parent node not found, please check the parentId is correct. if you don\'t know the parentId, you can use the tool "get_page_schema" to get the page schema. if you want to add to page root, just don\'t provide the parentId.'
              }
            }
          ]
        }
      }
    }

    if (referTargetNodeId) {
      const referTargetNode = useCanvas().getNodeById(referTargetNodeId)
      if (!referTargetNode) {
        return {
          content: [
            {
              type: 'json',
              value: {
                status: 'error',
                message:
                  "Refer target node not found, please check the referTargetNodeId is correct. if you dont want to refer to any node, just don't provide the referTargetNodeId."
              }
            }
          ]
        }
      }
    }

    useCanvas().operateNode({
      type: 'insert',
      parentId,
      newNodeData: {
        componentName,
        props,
        children
      },
      position,
      referTargetNodeId
    })

    return {
      content: [
        {
          type: 'json',
          value: {
            status: 'success',
            message: `Node added successfully`,
            data: {
              componentName,
              props,
              children
            }
          }
        }
      ]
    }
  }
}
