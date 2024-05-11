import { OpenAI } from 'openai'
import { z } from 'zod'
import { zodToJsonSchema, JsonSchema7Type, JsonSchema7ObjectType } from 'zod-to-json-schema'
import { assign, fromPromise, raise, setup } from 'xstate'
import { ApiConfig, chatLLM } from './fetch-llm'
import systemPrompt from '../prompts/component.system.md?raw'

function toSchema(...parameters: Parameters<typeof zodToJsonSchema>): JsonSchema7Type {
  const schema = zodToJsonSchema(...parameters)
  delete schema.$schema

  return schema as JsonSchema7Type
}

export function formToTools(form: AIForm): OpenAI.Chat.Completions.ChatCompletionTool[] {
  const formTool: OpenAI.Chat.Completions.ChatCompletionTool = {
    type: 'function',
    function: {
      name: form.name,
      description: form.description,
      parameters: form.fields.reduce<JsonSchema7ObjectType>(
        (prev, cur) => {
          prev.properties[cur.name] = toSchema(cur.schema)
          if (cur.required) {
            prev.required?.push(cur.name)
          }
          return prev
        },
        {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: false
        }
      )
    }
  }

  const fieldTools = form.fields.reduce<OpenAI.Chat.Completions.ChatCompletionTool[]>((prev, cur) => {
    if (!cur.renderer?.ui && !cur.renderer?.headless) {
      // TODO: improve
      return prev
    }

    const { description: fieldDescription } = toSchema(cur.schema)
    const fieldSchema = toSchema(cur.renderer?.props || z.object({}))
    return prev.concat({
      type: 'function',
      function: {
        name: `get_${cur.name}`,
        description: fieldDescription ? `Get: ${fieldDescription}` : undefined,
        parameters: fieldSchema
      }
    })
  }, [])

  const otherTools = (form.tools || []).reduce<OpenAI.Chat.Completions.ChatCompletionTool[]>((prev, cur) => {
    const { description } = toSchema(cur.schema)
    const toolSchema = toSchema(cur.renderer?.props || z.object({}))
    return prev.concat({
      type: 'function',
      function: {
        name: cur.name,
        description,
        parameters: toolSchema
      }
    })
  }, [])

  return [...fieldTools, ...otherTools, formTool]
}

export function getFieldUI(form: AIForm, toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
  const {
    id,
    function: { name: fName, arguments: fArguments }
  } = toolCall

  const field = form.tools?.find((t) => t.name === fName) || form.fields.find((f) => `get_${f.name}` === fName)

  if (!field) {
    return null
  }

  const ui = field.renderer?.ui

  return {
    ui,
    // TODO: validate
    props: {
      ...JSON.parse(fArguments),
      __field__: field.name
    },
    id,
    functionName: fName,
    functionArguments: fArguments
  }
}

export function getField(form: AIForm, toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) {
  const {
    id,
    function: { name: fName, arguments: fArguments }
  } = toolCall

  const field = form.tools?.find((t) => t.name === fName) || form.fields.find((f) => `get_${f.name}` === fName)

  return {
    field,
    // TODO: validate
    props: {
      ...JSON.parse(fArguments)
    },
    id,
    functionName: fName,
    functionArguments: fArguments
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodType = z.ZodType<any, any, any>

export type AIForm = {
  name: string
  description: string
  fields: FormField[]
  tools?: FormTool[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ui?: React.FC<any>
}

type FormField = {
  name: string
  schema: AnyZodType
  required: boolean
  renderer?: FormRenderer<AnyZodType, AnyZodType>
}

type FormTool = {
  name: string
  schema: AnyZodType
  renderer: FormRenderer<AnyZodType, AnyZodType> & {
    ui: Exclude<FormRenderer<AnyZodType, AnyZodType>['ui'], undefined>
    headless: Exclude<FormRenderer<AnyZodType, AnyZodType>['headless'], undefined>
  }
}

type FormRenderer<TProps extends AnyZodType, TValue extends AnyZodType> = {
  props: TProps
  ui?: React.FC<
    z.infer<TProps> & {
      value?: z.infer<TValue>
      onChange: (value: z.infer<TValue>) => void
      tool_call_id: string
    }
  >
  headless?: (params: { props: z.infer<TProps> }) => Promise<z.infer<TValue>>
}

export function createField<TProps extends AnyZodType, TValue extends AnyZodType>(options: {
  name: string
  schema: TValue
  required: boolean
  renderer?: FormRenderer<TProps, TValue>
}): FormField {
  return options as FormField
}

export function createTool<TProps extends AnyZodType, TValue extends AnyZodType>(options: {
  name: string
  schema: TValue
  renderer?: FormRenderer<TProps, TValue>
}): FormTool {
  return options as FormTool
}

export type FieldStates = Record<string, { value: unknown; functionName: string; functionArguments: string }>

export function fieldStatesToMessages(states: FieldStates): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  for (const id in states) {
    const state = states[id]
    messages.push(
      {
        role: 'assistant',
        tool_calls: [
          {
            id,
            type: 'function',
            function: {
              name: state.functionName,
              arguments: state.functionArguments
            }
          }
        ]
      },
      {
        role: 'tool',
        tool_call_id: id,
        content: JSON.stringify(state.value)
      }
    )
  }

  return messages
}

export async function submitForm(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  apiConfig: ApiConfig
) {
  return await chatLLM(
    (
      [
        {
          role: 'system',
          content: `- Always ask users to input information if required argument is not provided
- Do not call functions if required information is not provided
- response in Chinese`
        },
        {
          role: 'system',
          content: systemPrompt
        }
      ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    ).concat(messages),
    tools,
    'gpt-4-turbo',
    'edit_props',
    apiConfig
  )
}

export type Context = {
  userMessages: string[]
  fieldMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  headlessFieldMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  choices: OpenAI.Chat.Completions.ChatCompletion.Choice[]
  form: AIForm
}

const initContext: Context = {
  userMessages: [],
  fieldMessages: [],
  headlessFieldMessages: [],
  choices: [],
  form: null as unknown as AIForm
}

export const createAIMachine = (form: AIForm, apiConfig: ApiConfig) =>
  setup({
    actors: {
      submitForm: fromPromise(
        ({
          input
        }: {
          input: {
            userMessages: Context['userMessages']
            fieldMessages: Context['fieldMessages']
            headlessFieldMessages: Context['headlessFieldMessages']
            tools: OpenAI.Chat.Completions.ChatCompletionTool[]
          }
        }) => {
          const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = input.userMessages.map((m) => ({
            role: 'user',
            content: m
          }))
          return submitForm(
            messages.concat(input.fieldMessages).concat(input.headlessFieldMessages),
            input.tools,
            apiConfig
          )
        }
      ),
      executeHeadlessTools: fromPromise(
        ({ input }: { input: { form: Context['form']; choices: Context['choices'] } }) => {
          const headlessTools: Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>[] = []

          for (const c of input.choices) {
            for (const toolCall of c.message.tool_calls || []) {
              const field = getField(input.form, toolCall)
              if (field.field?.renderer?.headless) {
                headlessTools.push(
                  field.field?.renderer?.headless?.({ props: field.props }).then((result) => {
                    return [
                      {
                        role: 'assistant',
                        tool_calls: [
                          {
                            id: field.id,
                            type: 'function',
                            function: {
                              name: field.functionName,
                              arguments: field.functionArguments
                            }
                          }
                        ]
                      },
                      {
                        role: 'tool',
                        tool_call_id: field.id,
                        content: JSON.stringify(result)
                      }
                    ]
                  })
                )
              }
            }
          }

          return Promise.all(headlessTools).then((arrs) => {
            return arrs.reduce<OpenAI.Chat.Completions.ChatCompletionMessageParam[]>((prev, cur) => {
              return prev.concat(cur)
            }, [])
          })
        }
      )
    }
  }).createMachine({
    context: { ...initContext, form },
    id: 'AI-form',
    initial: 'wait_user_input',
    states: {
      wait_user_input: {
        on: {
          add_user_message: {
            target: 'call_AI',
            actions: assign({
              userMessages: ({ context, event }) => context.userMessages.concat(event.userMessages),
              fieldMessages: ({ event }) => event.fieldMessages
            })
          }
        }
      },
      call_AI: {
        on: {
          fetch: {
            target: 'loading'
          }
        },
        entry: raise({ type: 'fetch' })
      },
      loading: {
        invoke: {
          src: 'submitForm',
          input: ({ context }) => ({
            userMessages: context.userMessages,
            fieldMessages: context.fieldMessages,
            headlessFieldMessages: context.headlessFieldMessages,
            tools: formToTools(context.form)
          }),
          onError: 'error',
          onDone: {
            target: 'check_tool',
            actions: assign({
              choices: ({ event }) => {
                return event.output
              }
            })
          }
        }
      },
      error: {},
      check_tool: {
        entry: raise(({ context }) => {
          const { form, choices } = context as Context

          if (
            choices.some((c) => {
              const fields = (c.message.tool_calls || []).map((toolCall) => getField(form, toolCall))
              return fields.some((f) => f.field?.renderer?.headless)
            })
          ) {
            return {
              type: 'is_headless_tool'
            }
          }

          return {
            type: 'is_ui_tool'
          }
        }),
        on: {
          is_ui_tool: {
            target: 'wait_user_input'
          },
          is_headless_tool: {
            target: 'call_headless_field'
          }
        }
      },
      call_headless_field: {
        on: {
          execute: {
            target: 'headless_field_loading'
          }
        },
        entry: raise({ type: 'execute' })
      },
      headless_field_loading: {
        invoke: {
          src: 'executeHeadlessTools',
          input: ({ context }) => ({
            form: context.form,
            choices: context.choices
          }),
          onError: 'headless_field_error',
          onDone: {
            target: 'call_AI',
            actions: assign({
              headlessFieldMessages: ({ event }) => event.output
            })
          }
        }
      },
      headless_field_error: {}
    }
  })
