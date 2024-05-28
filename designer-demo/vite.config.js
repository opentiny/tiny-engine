import { defineConfig } from 'vite'
import getDefaultConfig from '@opentiny/tiny-engine/vite.config.js'

export default defineConfig((options) => {
  const defaultConfig = getDefaultConfig(options)

  return {
    ...defaultConfig,
    server: {
      ...defaultConfig.server,
      port: 8090
    }
  }
})
