import { AIClient } from '@opentiny/tiny-robot-kit'
import { OpenAICompatibleProvider, type ProviderConfig } from './OpenAICompatibleProvider'

const createClient = (config: ProviderConfig) => {
  const provider: OpenAICompatibleProvider = new OpenAICompatibleProvider(config)

  const client: AIClient = new AIClient({
    ...config,
    provider: 'custom',
    providerImplementation: provider
  })

  return { client, provider }
}

const { client, provider } = createClient({} as ProviderConfig)

const getClientConfig: () => ProviderConfig = provider.getBaseConfig.bind(provider)
const updateClientConfig: (config: ProviderConfig) => void = provider.updateConfig.bind(provider)

export { client, getClientConfig, updateClientConfig }
