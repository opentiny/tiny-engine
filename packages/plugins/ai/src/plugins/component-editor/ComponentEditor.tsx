import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import { useMachine } from '@xstate/react'
import { sharedApi } from '../shared-api'
import { dummyForm, getEditComponentForm, traverseSchema, mergeProps, revertProps } from './edit-component-form'
import { Context, FieldStates, createAIMachine, fieldStatesToMessages, getFieldUI } from '../ai-form'
import { ComponentProps } from '@/components/business/ApiConfigSteps'
import { DialogHeader } from '@/components/ui/dialog'
import { DialogTitle } from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import Markdown from 'react-markdown'
import icon from '/public/component-editor.svg'

export default function ComponentEditor({ apiConfig, onClose }: ComponentProps) {
  const [userMessage, setUserMessage] = useState('')
  const [fieldStates, setFieldStates] = useState<FieldStates>({})

  const { defaultValue, schema, machine, loopScope } = useMemo(() => {
    const schema = sharedApi.getPageSchema()
    const currentSchema = sharedApi.getCurrentSchema()

    const [defaultValue, loopScope] = traverseSchema(schema, currentSchema?.id || '', null)
    if (!defaultValue?.componentName) {
      return {
        defaultValue,
        machine: createAIMachine(dummyForm, apiConfig),
        schema,
        loopScope
      }
    }

    const aiForm = getEditComponentForm(defaultValue.componentName)
    const machine = createAIMachine(aiForm, apiConfig)

    return { defaultValue, machine, schema, loopScope }
  }, [apiConfig])
  const [value, setValue] = useState(mergeProps(defaultValue)?.props)

  const [state, send] = useMachine(machine)

  const submit = useCallback(() => {
    const { children: _, ...rest } = value
    send({
      type: 'add_user_message',
      userMessages: userMessage ? [userMessage] : [],
      fieldMessages: fieldStatesToMessages(fieldStates).concat([
        {
          role: 'user',
          content: `当前组件属性为\n
\`\`\`json
${JSON.stringify(rest)}
\`\`\`

---

**不要假设还存在其他全局配置，请在你的输出结果中返回 __state__ 和 __methods__，它们将会被合并至全局配置中。**：
目前全局已有 \`__state__\` 和 \`__methods__\` 如下：

\`\`\`json
{
  "__state__": ${JSON.stringify(schema.state || {})},
  "__methods__": ${JSON.stringify(schema.methods || {})}
}
\`\`\`

---

上下文信息，**注意，这部分不一定与用户需求有所关联，仅为全局通用信息，请结合实际需求使用，不要做出假设**：

${
  loopScope
    ? `如果有与循环数据相关的需求，请注意：当前  ${
        defaultValue?.componentName || ''
      } 组件已经处于 \`loop:${loopScope}\` 的循环渲染中。`
    : ''
}
`
        }
      ])
    })
    setUserMessage('')
  }, [value, userMessage, send, fieldStates, schema, defaultValue, loopScope])
  const { form } = state.context as Context

  useEffect(() => {
    for (const choice of (state.context as Context).choices.slice(0, 1)) {
      for (const toolCall of choice.message.tool_calls || []) {
        if (choice.message.tool_calls?.length === 1 && toolCall.function.name === form.name) {
          console.log(JSON.parse(toolCall.function.arguments))
          setValue(JSON.parse(toolCall.function.arguments))
        }
      }
    }
  }, [state.context, form.name])

  if (form.name === dummyForm.name) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>当前组件未支持 AI 编辑</DialogTitle>
        </DialogHeader>
        <Button
          variant="default"
          onClick={() => {
            onClose()
          }}
        >
          关闭
        </Button>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>修改组件属性</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col px-1">
        {state.matches('wait_user_input') && state.context.choices.length > 0 && (
          <ScrollArea className="flex-1 rounded-md mt-2">
            {(state.context as Context).choices.slice(0, 1).map((choice) => {
              return (
                <div key={choice.index}>
                  {Boolean(choice.message.content) && <Markdown className="my-2">{choice.message.content}</Markdown>}
                  {(choice.message.tool_calls || []).map((toolCall) => {
                    if (choice.message.tool_calls?.length === 1 && toolCall.function.name === form.name && form.ui) {
                      return <form.ui key={toolCall.id} value={value} onChange={setValue} />
                    }

                    const fieldUI = getFieldUI(form, toolCall)

                    if (!fieldUI?.ui) {
                      return null
                    }

                    return (
                      <div key={fieldUI.id}>
                        <fieldUI.ui
                          {...fieldUI.props}
                          value={fieldStates[fieldUI.id]?.value ?? fieldUI.props.value}
                          onChange={(value: unknown) => {
                            setFieldStates({
                              ...fieldStates,
                              [fieldUI.id]: {
                                value,
                                functionName: fieldUI.functionName,
                                functionArguments: fieldUI.functionArguments
                              }
                            })
                          }}
                          onSubmit={submit}
                        />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </ScrollArea>
        )}
        {state.matches('wait_user_input') && (state.context as Context).choices.length === 0 && form.ui && value && (
          <form.ui value={value} onChange={setValue} />
        )}
        {state.matches('loading') && (
          <div className="text-slate-400 animate-blink flex-1 flex border items-center justify-center">loading...</div>
        )}
        {state.matches('headless_field_loading') && (
          <div className="text-slate-400 animate-blink flex-1 flex border items-center justify-center">
            calling headless function...
          </div>
        )}
        <div className="mt-2 mb-4 flex justify-end items-end">
          <Textarea
            className="w-full mt-4"
            rows={2}
            value={userMessage}
            onChange={(evt) => {
              setUserMessage(evt.currentTarget.value)
            }}
            placeholder="输入指令，智能修改组件..."
          />
          <Button
            variant="outline"
            onClick={submit}
            disabled={!state.matches('wait_user_input')}
            className="w-[100px] ml-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M19 17v4" />
              <path d="M3 5h4" />
              <path d="M17 19h4" />
            </svg>
          </Button>
        </div>
      </div>
      <Button
        variant="default"
        onClick={() => {
          if (defaultValue) {
            defaultValue.props = value
            revertProps(defaultValue, schema, loopScope)
            console.log(schema)
            sharedApi.saveSchema(schema)
          }
          onClose()
        }}
      >
        保存
      </Button>
    </>
  )
}

export const Trigger = forwardRef<HTMLImageElement>((props, ref) => {
  return <img src={icon} ref={ref} {...props} width={24} height={24} />
})
