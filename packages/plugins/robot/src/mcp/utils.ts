import { toRaw } from 'vue'
import useMcpServer from './useMcp'
import type { LLMMessage, RobotMessage } from './types'
import type { LLMRequestBody, LLMResponse, ReponseToolCall, RequestOptions, RequestTool } from './types'
import { META_SERVICE, getMetaApi } from '@opentiny/tiny-engine-meta-register'

let requestOptions: RequestOptions = {}

// 格式化LLM输入messages消息
const formatMessages = (messages: LLMMessage[]) => {
  return messages.map((message) => ({
    role: message.role,
    content: message.content
  }))
}

const fetchLLM = async (messages: LLMMessage[], tools: RequestTool[], options: RequestOptions = requestOptions) => {
  const bodyObj: LLMRequestBody = {
    model: options?.model || 'deepseek-chat',
    stream: false,
    messages: toRaw(messages)
  }
  if (tools.length > 0) {
    bodyObj.tools = toRaw(tools)
  }
  return getMetaApi(META_SERVICE.Http).post(options?.url || '/app-center/api/chat/completions', bodyObj, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })
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
  messages: RobotMessage[],
  contextMessages?: RobotMessage[]
) => {
  if (messages.length < 1) {
    return
  }
  const currentMessage = messages.at(-1)!
  if (!currentMessage.renderContent) {
    currentMessage.renderContent = []
  }
  if (res.choices[0].message.content) {
    currentMessage.renderContent.push({
      type: 'markdown',
      content: res.choices[0].message.content
    })
  }
  const tool_calls: ReponseToolCall[] | undefined = res.choices[0].message.tool_calls
  if (tool_calls && tool_calls.length) {
    const historyMessages = contextMessages?.length ? contextMessages : toRaw(messages.slice(0, -1))
    const toolMessages: LLMMessage[] = [...historyMessages, res.choices[0].message] as LLMMessage[]
    for (const tool of tool_calls) {
      const { name, arguments: args } = tool.function
      const parsedArgs = parseArgs(args)
      const currentToolMessage = {
        type: 'tool',
        name,
        status: 'running',
        content: {
          params: parsedArgs
        },
        formatPretty: true
      }
      currentMessage.renderContent.push(currentToolMessage)
      const toolCallResult = await useMcpServer().callTool(name, parsedArgs)
      toolMessages.push({
        type: 'text',
        content: toolCallResult.content,
        role: 'tool',
        tool_call_id: tool.id
      })

      currentMessage.renderContent.at(-1)!.status = 'success'
      currentMessage.renderContent.at(-1)!.content = {
        params: parsedArgs,
        result: toolCallResult.content
      }
    }
    currentMessage.renderContent.push({ type: 'loading', content: '' })
    const newResp = await fetchLLM(toolMessages, tools)
    currentMessage.renderContent.pop()
    const hasToolCall = newResp.choices[0].message.tool_calls?.length > 0
    if (hasToolCall) {
      await handleToolCall(newResp, tools, messages, toolMessages)
    } else {
      if (newResp.choices[0].message.content) {
        currentMessage.renderContent.push({
          type: 'markdown',
          content: newResp.choices[0].message.content
        })
      }
    }
  }
}

export const sendMcpRequest = async (messages: LLMMessage[], options: RequestOptions = {}) => {
  if (messages.length < 1) {
    return
  }
  const tools = await useMcpServer().getLLMTools()
  requestOptions = options
  messages.at(-1)!.renderContent = [{ type: 'loading', content: '' }]
  const res = await fetchLLM(formatMessages(messages.slice(0, -1)), tools, options)
  delete messages.at(-1)!.renderContent
  const hasToolCall = res.choices[0].message.tool_calls?.length > 0
  if (hasToolCall) {
    await handleToolCall(res, tools, messages)
    messages.at(-1)!.content = messages.at(-1)!.renderContent.at(-1)!.content
  } else {
    messages.at(-1)!.content = res.choices[0].message.content
  }
}
