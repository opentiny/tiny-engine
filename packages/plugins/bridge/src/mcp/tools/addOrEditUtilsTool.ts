import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { RESOURCE_TYPE } from '../../js/constants'
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

const OPERATION = {
  ADD: 'add',
  EDIT: 'edit'
} as const

const inputSchema = z.object({
  operation: z.enum([OPERATION.ADD, OPERATION.EDIT]).describe('operation: add or edit'),
  id: z
    .number()
    .optional()
    .describe('if you want to edit a existing utils tool, you need to provide the id of the utils tool'),
  type: z.enum([RESOURCE_TYPE.Npm, RESOURCE_TYPE.Function]).describe('Utils category: npm or function'),
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

const validateParams = (
  operation: typeof OPERATION[keyof typeof OPERATION],
  id: number | undefined,
  type: typeof RESOURCE_TYPE[keyof typeof RESOURCE_TYPE],
  content: z.infer<typeof inputSchema>['content']
) => {
  if (operation === OPERATION.EDIT && !id) {
    return {
      isValid: false,
      content: {
        status: 'error',
        message: 'id is required when operation is edit',
        error: 'id is required'
      }
    }
  }

  if (operation === OPERATION.ADD && id) {
    return {
      isValid: false,
      content: {
        status: 'error',
        message: 'id is not allowed when operation is add',
        error: 'id is not allowed'
      }
    }
  }

  // 操作类型为编辑，带上 id
  if (operation === OPERATION.EDIT) {
    // data.id = id
    const { getUtilById } = getMetaApi(META_SERVICE.UseUtils)
    const item = getUtilById(id)

    // 校验 id 是否存在
    if (!item) {
      return {
        isValid: false,
        content: {
          status: 'error',
          message: 'cannot find the item by id. please check the id.',
          error: 'item not found.'
        }
      }
    }
  }

  if (type === RESOURCE_TYPE.Npm && typeof content === 'string') {
    return {
      isValid: false,
      content: {
        status: 'error',
        message: 'content must be an object when category is npm. Please read the input schema carefully.',
        error: 'content must be an object'
      }
    }
  }

  if (type === RESOURCE_TYPE.Npm) {
    const parsed = npmContentSchema.safeParse(content)
    if (!parsed.success) {
      return {
        isValid: false,
        content: { status: 'error', message: 'invalid npm content', error: parsed.error.flatten() }
      }
    }
  }

  return {
    isValid: true
  }
}

export const addOrEditUtilsTool = {
  name: 'add_or_edit_utils_tool',
  title: '新增或修改 Utils 工具',
  description:
    'Add a new utils item or edit an existing one in the current TinyEngine application. Use this to create or update utils.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { operation, id, type, name, content } = args
    const data: Record<string, any> = {
      name,
      category: 'utils',
      type: type as 'npm' | 'function',
      app: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    }

    const { updateUtils, addUtils } = getMetaApi(META_SERVICE.UseUtils) || {}
    const validateResult = validateParams(operation, id, type, content)

    if (!validateResult.isValid) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify(validateResult.content)
          }
        ]
      }
    }

    if (operation === OPERATION.EDIT) {
      data.id = id
    }

    try {
      let result: Record<string, any> | null = null

      if (type === RESOURCE_TYPE.Function) {
        data.content =
          typeof content === 'string'
            ? {
                type: 'JSFunction',
                value: content
              }
            : content
      }

      if (type === RESOURCE_TYPE.Npm) {
        data.content = content
      }

      if (operation === OPERATION.EDIT) {
        result = await updateUtils(data as IUtilItem)
      } else {
        result = await addUtils(data as Omit<IUtilItem, 'id'>)
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
