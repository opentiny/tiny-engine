import { OpenAICompatibleProvider, type ProviderConfig } from './OpenAICompatibleProvider'

const provider = new OpenAICompatibleProvider({} as ProviderConfig)

const getClientConfig: () => ProviderConfig = provider.getBaseConfig.bind(provider)
const updateClientConfig: (config: ProviderConfig) => void = provider.updateConfig.bind(provider)

export { provider, getClientConfig, updateClientConfig }
