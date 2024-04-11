import { fromMarkdown } from 'mdast-util-from-markdown'
import { OpenAI } from 'openai'
import { visitParents } from 'unist-util-visit-parents'

export type ApiConfig = { apiKey: string; proxy?: string }

export async function chatLLM(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  model: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming['model'],
  tool_choice: string,
  { apiKey, proxy }: ApiConfig
) {
  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    ...(proxy
      ? {
          baseURL: `${proxy}/v1`
        }
      : {})
  })

  const response = await openai.chat.completions.create({
    model,
    messages,
    ...{
      tools: tools.length ? tools : undefined,
      tool_choice: tools.length
        ? {
            type: 'function',
            function: {
              name: tool_choice
            }
          }
        : undefined
    }
  })

  return response.choices
}

export function extractCode(choices: OpenAI.Chat.Completions.ChatCompletion.Choice[]) {
  const codeBlocks: string[] = []
  const tree = fromMarkdown(choices[0].message.content || '')

  visitParents(tree, 'code', (node) => {
    codeBlocks.push(node.value.trim())
  })

  if (codeBlocks.length !== 1) {
    throw new Error(`invalid code blocks ${JSON.stringify(codeBlocks)}`)
  }

  return codeBlocks[0].trim()
}
