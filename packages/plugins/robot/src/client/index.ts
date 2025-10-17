import { AIClient, type AIModelConfig } from '@opentiny/tiny-robot-kit'
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider'
import useMcp from '../composables/useMcp'
import useRobot from '../js/useRobot'
import type { LLMMessage } from '../types/mcp-types'
import { getAgentSystemPrompt } from '../js/prompts'
import { utils } from '@opentiny/tiny-engine-utils'
import { getMetaApi, META_SERVICE, useCanvas } from '@opentiny/tiny-engine-meta-register'

const { deepClone } = utils
const { loadRobotSettingState, EXISTING_MODELS, aiMode, CHAT_MODE } = useRobot()
const { activeName, existModel, customizeModel } = loadRobotSettingState() || {}

const storageSettingState = (activeName === EXISTING_MODELS ? existModel : customizeModel) || {}

const config: Omit<AIModelConfig, 'provider' | 'providerImplementation'> = {
  apiKey: storageSettingState.apiKey || '',
  apiUrl: aiMode.value === CHAT_MODE.Agent ? '/app-center/api/ai/chat' : '/app-center/api/chat/completions',
  defaultModel: storageSettingState.model || 'deepseek-v3'
}

let provider: OpenAICompatibleProvider | null = null

const addSystemPrompt = (messages: LLMMessage[], prompt: string = '') => {
  if (!messages.length || messages[0].role !== 'system') {
    messages.unshift({ role: 'system', content: prompt })
  } else if (messages[0].role === 'system' && messages[0].content !== prompt) {
    messages[0].content = prompt
  }
}

export const search = async (content: string) => {
  let result = ''
  const MAX_SEARCH_LENGTH = 8000
  try {
    const res = await getMetaApi(META_SERVICE.Http).post('/app-center/api/ai/search', { content })

    res.forEach((item: { content: string }) => {
      if (result.length + item.content.length > MAX_SEARCH_LENGTH) {
        return
      }
      result += item.content
    })
  } catch (error) {
    // error
  }
  return result
}

const beforeRequest = async (requestParams: any) => {
  const { aiMode, CHAT_MODE, robotSettingState } = useRobot()
  const pageSchema = deepClone(useCanvas().pageState.pageSchema)
  const isAgentMode = aiMode.value === CHAT_MODE.Agent
  const tools = await useMcp().getLLMTools()
  if (!requestParams.tools && tools?.length && !isAgentMode) {
    Object.assign(requestParams, { tools })
  }
  if (isAgentMode) {
    requestParams.apiKey = robotSettingState.selectedModel.apiKey
    // let referenceContext = ''
    // if (requestParams.messages?.[0].role && requestParams.messages?.[0].role !== 'system') {
    //   referenceContext = await search(requestParams.messages?.at(-1)?.content)
    // }
    addSystemPrompt(requestParams.messages, getAgentSystemPrompt(pageSchema, ''))
  }
  requestParams.baseUrl = robotSettingState.selectedModel.baseUrl
  requestParams.model = robotSettingState.selectedModel.model
  if (config.apiKey !== robotSettingState.selectedModel.apiKey) {
    provider?.updateConfig({ apiKey: robotSettingState.selectedModel.apiKey })
    config.apiKey = robotSettingState.selectedModel.apiKey
  }
  return requestParams
}

provider = new OpenAICompatibleProvider(config, { beforeRequest })

const client = new AIClient({
  ...config,
  provider: 'custom',
  providerImplementation: provider
})

const updateLLMConfig = (newConfig: Omit<AIModelConfig, 'provider' | 'providerImplementation'>) => {
  provider?.updateConfig(newConfig)
  Object.assign(config, newConfig)
}

export { client, updateLLMConfig }
