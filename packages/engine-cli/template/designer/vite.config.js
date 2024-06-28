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

  const devAlias = {
    '@opentiny/tiny-engine-theme': ['light', 'dark'].includes(extOptions.VITE_THEME)
      ? path.resolve(
          process.cwd(),
          `./node_modules/@opentiny/tiny-engine-theme-${extOptions.VITE_THEME}/dist/style.css`
        )
      : ''
  }

  const config = {
    envDir,
    publicDir: path.resolve(__dirname, './public'),
    server: {
      port: 8090
    },
    resolve: {
      alias: devAlias
    }
  }

  return mergeConfig(defaultConfig, config)
})
