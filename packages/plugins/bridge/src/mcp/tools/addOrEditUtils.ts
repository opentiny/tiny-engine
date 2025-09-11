import { z } from 'zod'
import { getMetaApi, META_SERVICE, useResource } from '@opentiny/tiny-engine-meta-register'
import { RESOURCE_CATEGORY, RESOURCE_TYPE } from '../../js/resource'
import { requestAddReSource, requestUpdateReSource } from '../../http'
import type { IUtilItem } from '../../js/useUtils'

const npmContentSchema = z
  .object({
    name: z.string().optional().describe('Alias of the imported member'),
    package: z.string().describe('The npm package name'),
    exportName: z.string().describe('The exported member name'),
    destructuring: z.boolean().optional().describe('Whether to use destructuring import, default is true'),
    cdnLink: z.string().optional().describe('CDN link for canvas/preview'),
    version: z.string().optional().describe('The npm package version'),
    main: z.string().optional().describe('Entry path if needed')
  })
  .describe('NPM dependency description for the utils tool')

const functionContentSchema = z
  .union([
    z.string().describe('Function code as string'),
    z
      .object({
        type: z.literal('JSFunction').describe('Function content type'),
        value: z.string().describe('Function code content')
      })
      .describe('Function content object with explicit type and value')
  ])
  .describe('Function content for the utils tool')

// const addUtilsDataSchema = z.discriminatedUnion('category', [
//   z
//     .object({
//       category: z.literal(RESOURCE_CATEGORY.Npm).describe('Use npm dependency as utils'),
//       name: z.string().describe('The name of the utils tool'),
//       content: npmContentSchema
//     })
//     .describe('Utils defined by npm dependency'),
//   z
//     .object({
//       category: z.literal(RESOURCE_CATEGORY.Function).describe('Use JS function as utils'),
//       name: z.string().describe('The name of the utils tool'),
//       content: functionContentSchema
//     })
//     .describe('Utils defined by JS function')
// ])

const OPERATION = {
  ADD: 'add',
  EDIT: 'edit'
}

const inputSchema = z.object({
  operation: z.enum([OPERATION.ADD, OPERATION.EDIT]).describe('operation: add or edit'),
  id: z
    .number()
    .optional()
    .describe('if you want to edit a existing utils tool, you need to provide the id of the utils tool'),
  type: z.enum([RESOURCE_CATEGORY.Npm, RESOURCE_CATEGORY.Function]).describe('Utils category: npm or function'),
  name: z.string().describe('The name of the utils tool'),
  // 用 union 明确定义两种可接受格式，便于 AI 识别
  content: z
    .union([npmContentSchema, functionContentSchema])
    .describe(
      [
        'Utils content formats (select by category):',
        '',
        '1) When category = npm (object):',
        '{',
        '  package: string,          // npm package name, e.g. "@opentiny/vue"',
        '  exportName: string,       // exported member in the package, e.g. "Modal"',
        '  name?: string,            // optional alias for export, e.g. "TinyModal"',
        '  destructuring: boolean,   // true => import with braces; false => default import',
        '  cdnLink?: string,         // CDN link for canvas/preview usage',
        '  version: string,          // package version, e.g. "^3.0.0"',
        '  main?: string             // entry path if needed, usually omit',
        '}',
        '',
        'Example (npm, destructuring=true):',
        '{ "package": "@opentiny/vue", "exportName": "Modal", "name": "TinyModal", "destructuring": true, "version": "^3.0.0" }',
        '=> import { Modal as TinyModal } from "@opentiny/vue"; export { TinyModal }',
        '',
        'Example (npm, destructuring=false):',
        '{ "package": "lodash/clone", "exportName": "default", "destructuring": false, "version": "4.17.21" }',
        '=> import Clone from "lodash/clone"; export { Clone }',
        '',
        '2) When category = function (string or object):',
        '- string: "(a, b) => a + b"',
        '- object: { type: "JSFunction", value: "(a, b) => a + b" }',
        'Notes:',
        '- Prefer a pure function expression (no external closure dependencies).',
        '- The function should be serializable and executable in the target runtime.'
      ].join('\n')
    )
})

export const addUtils = {
  name: 'add_or_edit_utils',
  title: '新增或修改 Utils 工具',
  description:
    'Add a new or edit a existing utils tool to the current TinyEngine low-code application. Use this when you need to add new or edit existing utils tool to your application.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { operation, id, type, name, content } = args
    const data: Record<string, any> = {
      name,
      category: 'utils',
      type: type as 'npm' | 'function',
      app: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    }

    const { getUtilById, updateUtils, addUtils } = getMetaApi(META_SERVICE.UseUtils)

    if (operation === OPERATION.EDIT && !id) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'id is required when operation is edit',
              error: 'id is required'
            })
          }
        ]
      }
    }

    if (operation === OPERATION.ADD && id) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'id is not allowed when operation is add',
              error: 'id is not allowed'
            })
          }
        ]
      }
    }

    // 操作类型为编辑，带上 id
    if (operation === OPERATION.EDIT) {
      data.id = id
      // @ts-ignore
      const item = getUtilById(id)

      // 校验 id 是否存在
      if (!item) {
        return {
          content: [
            {
              isError: true,
              type: 'text',
              text: JSON.stringify({
                status: 'error',
                message: 'cannot find the item by id. please check the id.',
                error: 'item not found.'
              })
            }
          ]
        }
      }
    }

    if (type === RESOURCE_CATEGORY.Npm && typeof content === 'string') {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              message: 'content must be an object when category is npm. Please read the input schema carefully.',
              error: 'content must be an object'
            })
          }
        ]
      }
    }

    try {
      let result: Record<string, any> | null = null

      if (type === RESOURCE_CATEGORY.Function) {
        data.content =
          typeof content === 'string'
            ? {
                type: 'JSFunction',
                value: content
              }
            : content

        if (operation === OPERATION.EDIT) {
          result = await updateUtils(data as IUtilItem)
        } else {
          result = await addUtils(data as Omit<IUtilItem, 'id'>)
        }
      }

      if (type === RESOURCE_CATEGORY.Npm) {
        data.content = content

        if (operation === OPERATION.EDIT) {
          result = await requestUpdateReSource(data)
        } else {
          result = await requestAddReSource(data)
        }
      }

      if (result) {
        if (operation === OPERATION.EDIT) {
          // @ts-ignore
          const index = useResource().appSchemaState[RESOURCE_TYPE.Util].findIndex(
            (item: any) => item.name === result.name
          )

          if (index !== -1) {
            // @ts-ignore
            useResource().appSchemaState[RESOURCE_TYPE.Util][index] = result
          }
        } else {
          // @ts-ignore
          useResource().appSchemaState[RESOURCE_TYPE.Util].push(result)
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: 'Utils tool added or edited successfully',
              data: result
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
              message: 'Failed to add or edit utils tool',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
          }
        ]
      }
    }
  }
}
