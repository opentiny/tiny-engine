import path from 'node:path'
import { defineConfig, mergeConfig } from 'vite'
import { useTinyEngineBaseConfig } from '@opentiny/tiny-engine-vite-config'

export default defineConfig((configEnv) => {
  const baseConfig = useTinyEngineBaseConfig({
    viteConfigEnv: configEnv,
    root: __dirname,
    iconDirs: [path.resolve(__dirname, './node_modules/@opentiny/tiny-engine/assets/')],
    useSourceAlias: true,
    envDir: './env',
    registryPath: './registry.js'
  })
  const baseConfigProxy = baseConfig.server?.proxy || {}
  delete baseConfig.server.proxy

  const customConfig = {
    envDir: './env',
    publicDir: path.resolve(__dirname, './public'),
    server: {
      port: 8090,
      proxy: {
        '/app-center/api/ai': {
          target: 'http://127.0.0.1:7011',
          changeOrigin: true
        },
        ...baseConfigProxy
      }
    }
  }

  return mergeConfig(baseConfig, customConfig)
})
