import { AIClient, type AIModelConfig } from '@opentiny/tiny-robot-kit'
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider'
interface ClientOptions {
  config: Omit<AIModelConfig, 'provider' | 'providerImplementation'>
  beforeRequest: () => object
}

const createClient = ({ config, beforeRequest }: ClientOptions) => {
  const provider: OpenAICompatibleProvider = new OpenAICompatibleProvider(config, { beforeRequest })

  const client = new AIClient({
    ...config,
    provider: 'custom',
    providerImplementation: provider
  })

  return { client, provider }
}

export { createClient }
