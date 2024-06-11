import path from 'node:path'
import { defineConfig, mergeConfig, loadEnv } from 'vite'
import { getDefaultConfig } from '@opentiny/tiny-engine-vite-config'

export default defineConfig((options) => {
  const envDir = path.resolve(process.cwd(), 'env')
  const extOptions = {
    ...loadEnv(options.mode, envDir, 'VITE_'),
    iconDirs: [path.resolve(__dirname, './node_modules/@opentiny/tiny-engine/dist/assets/')]
  }
  const defaultConfig = getDefaultConfig(options, extOptions)

  const devAlias = {
    '@opentiny/tiny-engine-controller/js': path.resolve(__dirname, '../packages/controller/js'),
    '@opentiny/tiny-engine-common/component': path.resolve(__dirname, '../packages/common/component'),
    '@opentiny/tiny-engine-common': path.resolve(__dirname, '../packages/common/index.js'),
    '@opentiny/tiny-engine-controller/utils': path.resolve(__dirname, '../packages/controller/utils.js'),
    '@opentiny/tiny-engine-controller/adapter': path.resolve(__dirname, '../packages/controller/adapter.js'),
    '@opentiny/tiny-engine-controller': path.resolve(__dirname, '../packages/controller/src/index.js'),
    '@opentiny/tiny-engine-plugin-materials': path.resolve(__dirname, '../packages/plugins/materials/index.js'),
    '@opentiny/tiny-engine-plugin-block': path.resolve(__dirname, '../packages/plugins/block/index.js'),
    '@opentiny/tiny-engine-plugin-data': path.resolve(__dirname, '../packages/plugins/data/index.js'),
    '@opentiny/tiny-engine-plugin-datasource': path.resolve(__dirname, '../packages/plugins/datasource/index.js'),
    '@opentiny/tiny-engine-plugin-script': path.resolve(__dirname, '../packages/plugins/script/index.js'),
    '@opentiny/tiny-engine-plugin-tree': path.resolve(__dirname, '../packages/plugins/tree/index.js'),
    '@opentiny/tiny-engine-plugin-help': path.resolve(__dirname, '../packages/plugins/help/index.js'),
    '@opentiny/tiny-engine-plugin-schema': path.resolve(__dirname, '../packages/plugins/schema/index.js'),
    '@opentiny/tiny-engine-plugin-page': path.resolve(__dirname, '../packages/plugins/page/index.js'),
    '@opentiny/tiny-engine-plugin-i18n': path.resolve(__dirname, '../packages/plugins/i18n/index.js'),
    '@opentiny/tiny-engine-plugin-bridge': path.resolve(__dirname, '../packages/plugins/bridge/index.js'),
    '@opentiny/tiny-engine-plugin-tutorial': path.resolve(__dirname, '../packages/plugins/tutorial/index.js'),
    '@opentiny/tiny-engine-plugin-robot': path.resolve(__dirname, '../packages/plugins/robot/index.js'),
    '@opentiny/tiny-engine-settings-panel': path.resolve(__dirname, '../packages/settings/panel/index.js'),
    '@opentiny/tiny-engine-setting-events': path.resolve(__dirname, '../packages/settings/events/index.js'),
    '@opentiny/tiny-engine-setting-props': path.resolve(__dirname, '../packages/settings/props/index.js'),
    '@opentiny/tiny-engine-setting-styles': path.resolve(__dirname, '../packages/settings/styles/index.js'),
    '@opentiny/tiny-engine-toolbar-breadcrumb': path.resolve(__dirname, '../packages/toolbars/breadcrumb/index.js'),
    '@opentiny/tiny-engine-toolbar-fullscreen': path.resolve(__dirname, '../packages/toolbars/fullscreen/index.js'),
    '@opentiny/tiny-engine-toolbar-lang': path.resolve(__dirname, '../packages/toolbars/lang/index.js'),
    '@opentiny/tiny-engine-toolbar-layout': path.resolve(__dirname, '../packages/toolbars/layout/index.js'),
    '@opentiny/tiny-engine-toolbar-checkinout': path.resolve(__dirname, '../packages/toolbars/lock/index.js'),
    '@opentiny/tiny-engine-toolbar-logo': path.resolve(__dirname, '../packages/toolbars/logo/index.js'),
    '@opentiny/tiny-engine-toolbar-logout': path.resolve(__dirname, '../packages/toolbars/logout/index.js'),
    '@opentiny/tiny-engine-toolbar-media': path.resolve(__dirname, '../packages/toolbars/media/index.js'),
    '@opentiny/tiny-engine-toolbar-preview': path.resolve(__dirname, '../packages/toolbars/preview/index.js'),
    '@opentiny/tiny-engine-toolbar-generate-vue': path.resolve(__dirname, '../packages/toolbars/generate-vue/index.js'),
    '@opentiny/tiny-engine-toolbar-refresh': path.resolve(__dirname, '../packages/toolbars/refresh/index.js'),
    '@opentiny/tiny-engine-toolbar-redoundo': path.resolve(__dirname, '../packages/toolbars/redoundo/index.js'),
    '@opentiny/tiny-engine-toolbar-clean': path.resolve(__dirname, '../packages/toolbars/clean/index.js'),
    '@opentiny/tiny-engine-toolbar-save': path.resolve(__dirname, '../packages/toolbars/save/index.js'),
    '@opentiny/tiny-engine-toolbar-setting': path.resolve(__dirname, '../packages/toolbars/setting/index.js'),
    '@opentiny/tiny-engine-toolbar-collaboration': path.resolve(__dirname, '../packages/toolbars/collaboration/index.js'),
    '@opentiny/tiny-engine-theme-dark': path.resolve(__dirname, '../packages/theme/dark/index.less'),
    '@opentiny/tiny-engine-theme-light': path.resolve(__dirname, '../packages/theme/light/index.less'),
    '@opentiny/tiny-engine-svgs': path.resolve(__dirname, '../packages/svgs/index.js'),
    '@opentiny/tiny-engine-http': path.resolve(__dirname, '../packages/http/src/index.js'),
    '@opentiny/tiny-engine-canvas': path.resolve(__dirname, '../packages/canvas/src/index.js'),
    '@opentiny/tiny-engine-utils': path.resolve(__dirname, '../packages/utils/src/index.js'),
    '@opentiny/tiny-engine-webcomponent-core': path.resolve(__dirname, '../packages/webcomponent/src/lib.js'),
    '@opentiny/tiny-engine-i18n-host': path.resolve(__dirname, '../packages/i18n/src/lib.js'),
    '@opentiny/tiny-engine-builtin-component': path.resolve(__dirname, '../packages/builtinComponent/index.js'),
    '@opentiny/tiny-engine-entry': path.resolve(__dirname, '../packages/entry/src/index.js'),
    '@opentiny/tiny-engine-layout': path.resolve(__dirname, '../packages/layout/index.js'),
    '@opentiny/tiny-engine-configurator': path.resolve(__dirname, '../packages/configurator/src/index.js'),
    '@opentiny/tiny-engine-theme': ['light', 'dark'].includes(extOptions.VITE_THEME)
    ? path.resolve(process.cwd(), `../packages/theme/${extOptions.VITE_THEME}/index.less`)
    // ? path.resolve(process.cwd(), `./node_modules/@opentiny/tiny-engine-theme-${extOptions.VITE_THEME}/dist/style.css`)
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
