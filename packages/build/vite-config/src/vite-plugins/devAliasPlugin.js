import path from 'node:path'

/**
 * 获取开发态npm包Alias
 * @param {boolean|Object} useSourceAlias  alias配置
 * @param {string} useSourceAlias.basePath 基础路径
 * @returns alias
 */
const getDevAlias = (useSourceAlias) => {
  if (!useSourceAlias) return {}
  const defaultBasePath = path.resolve(process.cwd(), '..') // parent path
  const basePath = useSourceAlias.basePath || defaultBasePath
  return {
    '@opentiny/tiny-engine/canvas': path.resolve(basePath, 'packages/design-core/src/canvas/canvas.ts'),
    '@opentiny/tiny-engine': path.resolve(basePath, 'packages/design-core/index.js'),
    '@opentiny/tiny-engine-common/component': path.resolve(basePath, 'packages/common/component'),
    '@opentiny/tiny-engine-common/js': path.resolve(basePath, 'packages/common/js'),
    '@opentiny/tiny-engine-common': path.resolve(basePath, 'packages/common/index.ts'),
    '@opentiny/tiny-engine-plugin-materials': path.resolve(basePath, 'packages/plugins/materials/index.ts'),
    '@opentiny/tiny-engine-plugin-block': path.resolve(basePath, 'packages/plugins/block/index.ts'),
    '@opentiny/tiny-engine-plugin-state': path.resolve(basePath, 'packages/plugins/state/index.ts'),
    '@opentiny/tiny-engine-plugin-datasource': path.resolve(basePath, 'packages/plugins/datasource/index.ts'),
    '@opentiny/tiny-engine-plugin-script': path.resolve(basePath, 'packages/plugins/script/index.ts'),
    '@opentiny/tiny-engine-plugin-tree': path.resolve(basePath, 'packages/plugins/tree/index.ts'),
    '@opentiny/tiny-engine-plugin-help': path.resolve(basePath, 'packages/plugins/help/index.ts'),
    '@opentiny/tiny-engine-plugin-schema': path.resolve(basePath, 'packages/plugins/schema/index.ts'),
    '@opentiny/tiny-engine-plugin-page': path.resolve(basePath, 'packages/plugins/page/index.ts'),
    '@opentiny/tiny-engine-plugin-i18n': path.resolve(basePath, 'packages/plugins/i18n/index.ts'),
    '@opentiny/tiny-engine-plugin-bridge': path.resolve(basePath, 'packages/plugins/bridge/index.ts'),
    '@opentiny/tiny-engine-plugin-tutorial': path.resolve(basePath, 'packages/plugins/tutorial/index.ts'),
    '@opentiny/tiny-engine-plugin-robot': path.resolve(basePath, 'packages/plugins/robot/index.ts'),
    '@opentiny/tiny-engine-settings-panel': path.resolve(basePath, 'packages/settings/panel/index.ts'),
    '@opentiny/tiny-engine-setting-events': path.resolve(basePath, 'packages/settings/events/index.ts'),
    '@opentiny/tiny-engine-setting-props': path.resolve(basePath, 'packages/settings/props/index.ts'),
    '@opentiny/tiny-engine-setting-styles': path.resolve(basePath, 'packages/settings/styles/index.ts'),
    '@opentiny/tiny-engine-toolbar-breadcrumb': path.resolve(basePath, 'packages/toolbars/breadcrumb/index.ts'),
    '@opentiny/tiny-engine-toolbar-fullscreen': path.resolve(basePath, 'packages/toolbars/fullscreen/index.ts'),
    '@opentiny/tiny-engine-toolbar-lang': path.resolve(basePath, 'packages/toolbars/lang/index.ts'),
    '@opentiny/tiny-engine-toolbar-view-setting': path.resolve(basePath, 'packages/toolbars/view-setting/index.ts'),
    '@opentiny/tiny-engine-toolbar-lock': path.resolve(basePath, 'packages/toolbars/lock/index.ts'),
    '@opentiny/tiny-engine-toolbar-logo': path.resolve(basePath, 'packages/toolbars/logo/index.ts'),
    '@opentiny/tiny-engine-toolbar-media': path.resolve(basePath, 'packages/toolbars/media/index.ts'),
    '@opentiny/tiny-engine-toolbar-preview': path.resolve(basePath, 'packages/toolbars/preview/index.ts'),
    '@opentiny/tiny-engine-toolbar-generate-code': path.resolve(basePath, 'packages/toolbars/generate-code/index.ts'),
    '@opentiny/tiny-engine-toolbar-refresh': path.resolve(basePath, 'packages/toolbars/refresh/index.ts'),
    '@opentiny/tiny-engine-toolbar-redoundo': path.resolve(basePath, 'packages/toolbars/redoundo/index.ts'),
    '@opentiny/tiny-engine-toolbar-clean': path.resolve(basePath, 'packages/toolbars/clean/index.ts'),
    '@opentiny/tiny-engine-toolbar-theme-switch': path.resolve(basePath, 'packages/toolbars/themeSwitch/index.ts'),
    '@opentiny/tiny-engine-toolbar-save': path.resolve(basePath, 'packages/toolbars/save/index.ts'),
    '@opentiny/tiny-engine-toolbar-setting': path.resolve(basePath, 'packages/toolbars/setting/index.ts'),
    '@opentiny/tiny-engine-toolbar-collaboration': path.resolve(basePath, 'packages/toolbars/collaboration/index.ts'),
    '@opentiny/tiny-engine-theme-base': path.resolve(basePath, 'packages/theme/base/src/index.ts'),
    '@opentiny/tiny-engine-svgs': path.resolve(basePath, 'packages/svgs/index.ts'),
    '@opentiny/tiny-engine-canvas/render': path.resolve(basePath, 'packages/canvas/render/index.ts'),
    '@opentiny/tiny-engine-canvas': path.resolve(basePath, 'packages/canvas/index.ts'),
    '@opentiny/tiny-engine-utils': path.resolve(basePath, 'packages/utils/src/index.ts'),
    '@opentiny/tiny-engine-webcomponent-core': path.resolve(basePath, 'packages/webcomponent/src/lib.js'),
    '@opentiny/tiny-engine-i18n-host': path.resolve(basePath, 'packages/i18n/src/lib.ts'),
    '@opentiny/tiny-engine-builtin-component': path.resolve(basePath, 'packages/builtinComponent/index.ts'),
    '@opentiny/tiny-engine-meta-register': path.resolve(basePath, 'packages/register/src/index.ts'),
    '@opentiny/tiny-engine-layout': path.resolve(basePath, 'packages/layout/index.ts'),
    '@opentiny/tiny-engine-configurator': path.resolve(basePath, 'packages/configurator/src/index.ts'),
    '@opentiny/tiny-engine-block-compiler': path.resolve(basePath, 'packages/block-compiler/src/index.ts')
  }
}

/**
 * 源码调试插件
 * 开启后，会指定  alias 到官方源码 package
 * @param {*} env
 * @returns
 */
export const devAliasPlugin = (env, useSourceAlias) => {
  return {
    name: 'vite-plugin-dev-alias',
    config(config, { command }) {
      // devAlias 只在 serve 模式下生效
      if (command === 'serve') {
        return {
          resolve: {
            alias: {
              ...getDevAlias(useSourceAlias)
            }
          }
        }
      }

      if (command === 'build') {
        return {
          resolve: {
            alias: {
              // 构建不使用 alias
            }
          }
        }
      }
    }
  }
}
