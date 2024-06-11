import path from 'node:path'
import { defineConfig, mergeConfig, loadEnv } from 'vite'
import { getDefaultConfig } from '@opentiny/tiny-engine-vite-config'

export default defineConfig((options) => {
  const envDir = path.resolve(process.cwd(), 'env')
  const extOptions = {
    ...loadEnv(options.mode, envDir, 'VITE_'),
    iconDirs: [path.resolve(__dirname, './node_modules/@opentiny/tiny-engine/assets/')]
  }
  const defaultConfig = getDefaultConfig(options, extOptions)

  const config = {
    envDir,
    publicDir: path.resolve(__dirname, './public'),
    server: {
      port: 8090
    }
  }
  
  return mergeConfig(defaultConfig, config)
})
