import { AIClient } from '@opentiny/tiny-robot-kit'
import { OpenAICompatibleProvider, type ProviderConfig } from './OpenAICompatibleProvider'

const createClient = (config: ProviderConfig) => {
  const provider: OpenAICompatibleProvider = new OpenAICompatibleProvider(config)

  const client = new AIClient({
    ...config,
    provider: 'custom',
    providerImplementation: provider
  })

  return { client, provider }
}

const { client, provider } = createClient({} as ProviderConfig)

const getClientConfig = provider.getBaseConfig.bind(provider)
const updateClientConfig = provider.updateConfig.bind(provider)

export { client, getClientConfig, updateClientConfig }
