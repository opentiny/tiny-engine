import { defineConfig, mergeConfig } from 'vite'
import getDefaultConfig from '@opentiny/tiny-engine/vite.config.js'

export default defineConfig((options) => {
  const defaultConfig = getDefaultConfig(options)
  const config = {
    server: {
      port: 8090
    }
  }

  return mergeConfig(defaultConfig, config)
})
