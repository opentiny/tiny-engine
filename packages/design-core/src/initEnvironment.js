import { useEnvironmentConfig } from '@opentiny/tiny-engine-controller'

export const initEnvironment = () => {
  const MODE = import.meta.env.MODE

  useEnvironmentConfig({
    MODE,
    PROD: import.meta.env.PROD,
    BASE_URL: import.meta.env.BASE_URL,
    VITE_ORIGIN: import.meta.env.VITE_ORIGIN,
    VITE_API_MOCK: import.meta.env.VITE_API_MOCK,
    isMock: import.meta.env.VITE_API_MOCK === 'mock',
    VITE_CDN_DOMAIN: import.meta.env.VITE_CDN_DOMAIN,
    isLocalEnv: window.vscodeBridge,
    isDevelopEnv: MODE?.includes('dev'),
    isAlphaEnv: MODE?.includes('alpha'),
    isProdEnv: MODE?.includes('prod'),
    ERROR_MONITOR_URL: import.meta.env.VITE_ERROR_MONITOR_URL,
    ERROR_MONITOR: import.meta.env.VITE_ERROR_MONITOR
  })
}
