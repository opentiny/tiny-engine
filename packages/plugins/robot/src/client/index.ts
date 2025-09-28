import { AIClient, type AIModelConfig } from '@opentiny/tiny-robot-kit'
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider'
import useMcp from '../composables/useMcp'
import useRobot from '../js/useRobot'

const config: Omit<AIModelConfig, 'provider' | 'providerImplementation'> = {
  apiKey: '',
  apiUrl: '/app-center/api/chat/completions', // '/app-center/api/ai/chat' | '/app-center/api/chat/completions'
  defaultModel: 'deepseek-v3'
}

let provider: OpenAICompatibleProvider | null = null

const { robotSettingState } = useRobot()

const beforeRequest = async (requestParams: any) => {
  const tools = (await useMcp().getLLMTools()) || []
  if (!requestParams.tools && tools.length) {
    Object.assign(requestParams, { tools })
  }
  if (config.apiUrl === '/app-center/api/ai/chat') {
    requestParams.apiKey = robotSettingState.selectedModel.apiKey
  }
  requestParams.baseUrl = robotSettingState.selectedModel.baseUrl
  if (
    config.apiKey !== robotSettingState.selectedModel.apiKey ||
    config.defaultModel !== robotSettingState.selectedModel.model
  ) {
    provider?.updateConfig({
      apiKey: robotSettingState.selectedModel.apiKey,
      defaultModel: robotSettingState.selectedModel.model
    })
    config.apiKey = robotSettingState.selectedModel.apiKey
    config.defaultModel = robotSettingState.selectedModel.model
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
