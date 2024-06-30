import path from 'node:path'

const devAlias = {
  '@opentiny/tiny-engine/canvas': path.resolve(process.cwd(), '../packages/design-core/src/canvas/canvas.js'),
  '@opentiny/tiny-engine': path.resolve(process.cwd(), '../packages/design-core/index.js'),
  '@opentiny/tiny-engine-common/component': path.resolve(process.cwd(), '../packages/common/component'),
  '@opentiny/tiny-engine-common/js': path.resolve(process.cwd(), '../packages/common/js'),
  '@opentiny/tiny-engine-common': path.resolve(process.cwd(), '../packages/common/index.js'),
  '@opentiny/tiny-engine-plugin-materials': path.resolve(process.cwd(), '../packages/plugins/materials/index.js'),
  '@opentiny/tiny-engine-plugin-block': path.resolve(process.cwd(), '../packages/plugins/block/index.js'),
  '@opentiny/tiny-engine-plugin-data': path.resolve(process.cwd(), '../packages/plugins/data/index.js'),
  '@opentiny/tiny-engine-plugin-datasource': path.resolve(process.cwd(), '../packages/plugins/datasource/index.js'),
  '@opentiny/tiny-engine-plugin-script': path.resolve(process.cwd(), '../packages/plugins/script/index.js'),
  '@opentiny/tiny-engine-plugin-tree': path.resolve(process.cwd(), '../packages/plugins/tree/index.js'),
  '@opentiny/tiny-engine-plugin-help': path.resolve(process.cwd(), '../packages/plugins/help/index.js'),
  '@opentiny/tiny-engine-plugin-schema': path.resolve(process.cwd(), '../packages/plugins/schema/index.js'),
  '@opentiny/tiny-engine-plugin-page': path.resolve(process.cwd(), '../packages/plugins/page/index.js'),
  '@opentiny/tiny-engine-plugin-i18n': path.resolve(process.cwd(), '../packages/plugins/i18n/index.js'),
  '@opentiny/tiny-engine-plugin-bridge': path.resolve(process.cwd(), '../packages/plugins/bridge/index.js'),
  '@opentiny/tiny-engine-plugin-tutorial': path.resolve(process.cwd(), '../packages/plugins/tutorial/index.js'),
  '@opentiny/tiny-engine-plugin-robot': path.resolve(process.cwd(), '../packages/plugins/robot/index.js'),
  '@opentiny/tiny-engine-settings-panel': path.resolve(process.cwd(), '../packages/settings/panel/index.js'),
  '@opentiny/tiny-engine-setting-events': path.resolve(process.cwd(), '../packages/settings/events/index.js'),
  '@opentiny/tiny-engine-setting-props': path.resolve(process.cwd(), '../packages/settings/props/index.js'),
  '@opentiny/tiny-engine-setting-styles': path.resolve(process.cwd(), '../packages/settings/styles/index.js'),
  '@opentiny/tiny-engine-toolbar-breadcrumb': path.resolve(process.cwd(), '../packages/toolbars/breadcrumb/index.js'),
  '@opentiny/tiny-engine-toolbar-fullscreen': path.resolve(process.cwd(), '../packages/toolbars/fullscreen/index.js'),
  '@opentiny/tiny-engine-toolbar-lang': path.resolve(process.cwd(), '../packages/toolbars/lang/index.js'),
  '@opentiny/tiny-engine-toolbar-layout': path.resolve(process.cwd(), '../packages/toolbars/layout/index.js'),
  '@opentiny/tiny-engine-toolbar-checkinout': path.resolve(process.cwd(), '../packages/toolbars/lock/index.js'),
  '@opentiny/tiny-engine-toolbar-logo': path.resolve(process.cwd(), '../packages/toolbars/logo/index.js'),
  '@opentiny/tiny-engine-toolbar-logout': path.resolve(process.cwd(), '../packages/toolbars/logout/index.js'),
  '@opentiny/tiny-engine-toolbar-media': path.resolve(process.cwd(), '../packages/toolbars/media/index.js'),
  '@opentiny/tiny-engine-toolbar-preview': path.resolve(process.cwd(), '../packages/toolbars/preview/index.js'),
  '@opentiny/tiny-engine-toolbar-generate-vue': path.resolve(
    process.cwd(),
    '../packages/toolbars/generate-vue/index.js'
  ),
  '@opentiny/tiny-engine-toolbar-refresh': path.resolve(process.cwd(), '../packages/toolbars/refresh/index.js'),
  '@opentiny/tiny-engine-toolbar-redoundo': path.resolve(process.cwd(), '../packages/toolbars/redoundo/index.js'),
  '@opentiny/tiny-engine-toolbar-clean': path.resolve(process.cwd(), '../packages/toolbars/clean/index.js'),
  '@opentiny/tiny-engine-toolbar-save': path.resolve(process.cwd(), '../packages/toolbars/save/index.js'),
  '@opentiny/tiny-engine-toolbar-setting': path.resolve(process.cwd(), '../packages/toolbars/setting/index.js'),
  '@opentiny/tiny-engine-toolbar-collaboration': path.resolve(
    process.cwd(),
    '../packages/toolbars/collaboration/index.js'
  ),
  '@opentiny/tiny-engine-theme-dark': path.resolve(process.cwd(), '../packages/theme/dark/index.less'),
  '@opentiny/tiny-engine-theme-light': path.resolve(process.cwd(), '../packages/theme/light/index.less'),
  '@opentiny/tiny-engine-svgs': path.resolve(process.cwd(), '../packages/svgs/index.js'),
  '@opentiny/tiny-engine-http': path.resolve(process.cwd(), '../packages/http/src/index.js'),
  '@opentiny/tiny-engine-canvas': path.resolve(process.cwd(), '../packages/canvas/index.js'),
  '@opentiny/tiny-engine-utils': path.resolve(process.cwd(), '../packages/utils/src/index.js'),
  '@opentiny/tiny-engine-webcomponent-core': path.resolve(process.cwd(), '../packages/webcomponent/src/lib.js'),
  '@opentiny/tiny-engine-i18n-host': path.resolve(process.cwd(), '../packages/i18n/src/lib.js'),
  '@opentiny/tiny-engine-builtin-component': path.resolve(process.cwd(), '../packages/builtinComponent/index.js'),
  '@opentiny/tiny-engine-meta-register': path.resolve(process.cwd(), '../packages/register/src/index.js'),
  '@opentiny/tiny-engine-layout': path.resolve(process.cwd(), '../packages/layout/index.js'),
  '@opentiny/tiny-engine-configurator': path.resolve(process.cwd(), '../packages/configurator/src/index.js')
}

/**
 * 源码调试插件
 * 开启后，会指定  alias 到官方源码 package
 * @param {*} env
 * @returns
 */
export const devAliasPlugin = (env) => {
  return {
    name: 'vite-plugin-dev-alias',
    config(config, { command }) {
      // devAlias 只在 serve 模式下生效
      if (command === 'serve') {
        return {
          resolve: {
            alias: {
              ...devAlias,
              '@opentiny/tiny-engine-theme': ['light', 'dark'].includes(env.VITE_THEME)
                ? path.resolve(process.cwd(), `../packages/theme/${env.VITE_THEME}/index.less`)
                : ''
            }
          }
        }
      }

      if (command === 'build') {
        return {
          resolve: {
            alias: {
              '@opentiny/tiny-engine-theme': ['light', 'dark'].includes(env.VITE_THEME)
                ? path.resolve(
                    process.cwd(),
                    `./node_modules/@opentiny/tiny-engine-theme-${env.VITE_THEME}/dist/style.css`
                  )
                : ''
            }
          }
        }
      }
    }
  }
}
