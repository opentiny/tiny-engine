import { toRaw } from 'vue'
import useMcpServer from './useMcp'
import type { BubbleMessageProps } from '@opentiny/tiny-robot'
import type { LLMRequestBody, LLMResponse, ReponseToolCall, RequestOptions, RequestTool } from './types'

let requestOptions: RequestOptions = {}

const fetchLLM = async (
  messages: BubbleMessageProps[],
  tools: RequestTool[],
  options: RequestOptions = requestOptions
) => {
  const bodyObj: LLMRequestBody = {
    model: options?.model || 'deepseek-ai/DeepSeek-V3',
    stream: false,
    messages: toRaw(messages)
  }
  if (tools.length > 0) {
    bodyObj.tools = toRaw(tools)
  }
  return fetch(options?.url || '/app-center/api/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify(bodyObj)
  }).then((res) => res.json())
}

const parseArgs = (args: string) => {
  try {
    return JSON.parse(args)
  } catch (error) {
    return args
  }
}

const handleToolCall = async (
  res: LLMResponse,
  tools: RequestTool[],
  messages: BubbleMessageProps[],
  contextMessages?: BubbleMessageProps[]
) => {
  if (messages.length < 1) {
    return
  }
  const currentMessage = messages.at(-1)!
  if (!currentMessage.messages) {
    currentMessage.messages = []
  }
  if (res.choices[0].message.content) {
    currentMessage.messages.push({
      type: 'markdown',
      content: res.choices[0].message.content
    })
  }
  const tool_calls: ReponseToolCall[] | undefined = res.choices[0].message.tool_calls
  if (tool_calls && tool_calls.length) {
    const historyMessages = contextMessages?.length ? contextMessages : toRaw(messages.slice(0, -1))
    const toolMessages = [...historyMessages, res.choices[0].message] as BubbleMessageProps[]
    for (const tool of tool_calls) {
      const { name, arguments: args } = tool.function
      const parsedArgs = parseArgs(args)
      const currentToolMessage = {
        type: 'tool',
        name,
        status: 'running',
        params: {
          params: parsedArgs
        },
        formatPretty: true
      }
      currentMessage.messages.push(currentToolMessage)
      const toolCallResult = await useMcpServer().callTool(name, parsedArgs)
      toolMessages.push({
        type: 'text',
        content: toolCallResult.content,
        role: 'tool',
        tool_call_id: tool.id
      })

      currentMessage.messages.at(-1).status = 'success'
      currentMessage.messages.at(-1).params = {
        params: parsedArgs,
        result: toolCallResult.content
      }
    }
    const newResp = await fetchLLM(toolMessages, tools)
    const hasToolCall = newResp.choices[0].message.tool_calls?.length > 0
    if (hasToolCall) {
      await handleToolCall(newResp, tools, messages, toolMessages)
    } else {
      if (newResp.choices[0].message.content) {
        currentMessage.messages.push({
          type: 'markdown',
          content: newResp.choices[0].message.content
        })
      }
    }
  }
}

export const sendMcpRequest = async (messages: BubbleMessageProps[], options: RequestOptions = {}) => {
  if (messages.length < 1) {
    return
  }
  const tools = await useMcpServer().getLLMTools()
  requestOptions = options
  const res = await fetchLLM(messages.slice(0, -1), tools, options)
  const hasToolCall = res.choices[0].message.tool_calls?.length > 0
  if (hasToolCall) {
    await handleToolCall(res, tools, messages)
  } else {
    messages.at(-1)!.content = res.choices[0].message.content
  }
}
