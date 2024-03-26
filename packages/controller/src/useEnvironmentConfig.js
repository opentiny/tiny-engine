import { ref } from 'vue'

const config = ref({})

const setEnvironmentConfig = (newConfig = {}) => {
  for (const [key, value] of Object.entries(newConfig)) {
    config.value[key] = value
  }
}

export const useEnvironmentConfig = (initConfig) => {
  if (initConfig) {
    setEnvironmentConfig(initConfig)
  }

  return {
    config,
    setEnvironmentConfig
  }
}
