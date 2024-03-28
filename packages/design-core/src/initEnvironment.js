import { useEnvironmentConfig } from '@opentiny/tiny-engine-controller'

export const initEnvironment = () => {
  useEnvironmentConfig({
    BASE_URL: import.meta.env.BASE_URL,
    isMock: import.meta.env.VITE_API_MOCK === 'mock'
  })
}
