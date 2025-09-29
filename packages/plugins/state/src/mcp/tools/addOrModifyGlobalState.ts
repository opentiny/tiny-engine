import { z } from 'zod'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

const inputSchema = z.object({
  id: z
    .string()
    .describe(['全局变量唯一标识（store 名称）。若同名已存在则执行更新，否则新增。', '示例："testState"'].join('\n')),
  state: z
    .record(z.string(), z.unknown())
    .describe(
      [
        '初始化状态内容（对象）。会被原样存储并用于运行期作为响应式状态。',
        '示例：',
        '{',
        '  "name": "testName",',
        '  "license": "",',
        '  "age": 18,',
        '  "food": ["apple", "orange", "banana", 19],',
        '  "desc": {',
        '    "description": "hello world",',
        '    "money": 100,',
        '    "other": "",',
        '    "rest": ["a", "b", "c", 20]',
        '  }',
        '}'
      ].join('\n')
    ),
  getters: z
    .record(
      z.string(),
      z.object({
        type: z.literal('JSFunction').describe('固定为 JSFunction'),
        value: z.string().describe('函数代码，this 指向 state。例如："function getAge(){ return this.age }"')
      })
    )
    .optional()
    .describe(
      [
        '可选。Getter 函数集合，对象键为方法名，值为 { type:"JSFunction", value:"代码" }。',
        '示例：',
        '{',
        '  "getAge": { "type": "JSFunction", "value": "function getAge(){\n return this.age \n}" },',
        '  "getName": { "type": "JSFunction", "value": "function getName(){\n return this.name \n}" }',
        '}'
      ].join('\n')
    ),
  actions: z
    .record(
      z.string(),
      z.object({
        type: z.literal('JSFunction').describe('固定为 JSFunction'),
        value: z.string().describe('函数代码，可修改 state。例如："function setAge(age){ this.age = age }"')
      })
    )
    .optional()
    .describe(
      [
        '可选。Action 函数集合，对象键为方法名，值为 { type:"JSFunction", value:"代码" }。',
        '示例：',
        '{',
        '  "setAge": { "type": "JSFunction", "value": "function setAge(age){\n this.age = age; \n}" },',
        '  "setName": { "type": "JSFunction", "value": "function setName(name){\n this.name = name; \n}" }',
        '}'
      ].join('\n')
    )
})

export const addOrModifyGlobalState = {
  name: 'add_or_modify_global_state',
  title: '新增或修改全局变量',
  description: 'Add or modify a global state. If the id exists, update it; otherwise, add a new one.',
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    const { id, state, getters, actions } = args
    const apis = getMetaApi(META_SERVICE.GlobalStateService)

    if (!apis) {
      return {
        content: [
          {
            isError: true,
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              error: 'SERVICE_UNAVAILABLE',
              message: 'GlobalStateService not registered'
            })
          }
        ]
      }
    }

    const { getGlobalStateById, addGlobalState, updateGlobalState } = apis

    try {
      const exists = Boolean(getGlobalStateById(id))
      const payload = {
        id,
        state,
        getters: getters ?? {},
        actions: actions ?? {}
      }

      if (exists) {
        await updateGlobalState(payload as any)
        const updated = getGlobalStateById(id)
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                message: 'Global state updated successfully',
                data: updated
              })
            }
          ]
        }
      }

      await addGlobalState(payload as any)
      const added = getGlobalStateById(id)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: 'Global state added successfully',
              data: added
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
              message: 'Failed to add or modify global state',
              error: error instanceof Error ? error.message : 'Unknown error occurred'
            })
          }
        ]
      }
    }
  }
}
