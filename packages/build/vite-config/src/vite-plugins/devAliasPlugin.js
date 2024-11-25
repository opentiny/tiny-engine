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
    '@opentiny/tiny-engine/canvas': path.resolve(basePath, 'packages/design-core/src/canvas/canvas.js'),
    '@opentiny/tiny-engine': path.resolve(basePath, 'packages/design-core/index.js'),
    '@opentiny/tiny-engine-common/component': path.resolve(basePath, 'packages/common/component'),
    '@opentiny/tiny-engine-common/js': path.resolve(basePath, 'packages/common/js'),
    '@opentiny/tiny-engine-common': path.resolve(basePath, 'packages/common/index.js'),
    '@opentiny/tiny-engine-plugin-materials': path.resolve(basePath, 'packages/plugins/materials/index.js'),
    '@opentiny/tiny-engine-plugin-block': path.resolve(basePath, 'packages/plugins/block/index.js'),
    '@opentiny/tiny-engine-plugin-state': path.resolve(basePath, 'packages/plugins/state/index.js'),
    '@opentiny/tiny-engine-plugin-datasource': path.resolve(basePath, 'packages/plugins/datasource/index.js'),
    '@opentiny/tiny-engine-plugin-script': path.resolve(basePath, 'packages/plugins/script/index.js'),
    '@opentiny/tiny-engine-plugin-tree': path.resolve(basePath, 'packages/plugins/tree/index.js'),
    '@opentiny/tiny-engine-plugin-help': path.resolve(basePath, 'packages/plugins/help/index.js'),
    '@opentiny/tiny-engine-plugin-schema': path.resolve(basePath, 'packages/plugins/schema/index.js'),
    '@opentiny/tiny-engine-plugin-page': path.resolve(basePath, 'packages/plugins/page/index.js'),
    '@opentiny/tiny-engine-plugin-i18n': path.resolve(basePath, 'packages/plugins/i18n/index.js'),
    '@opentiny/tiny-engine-plugin-bridge': path.resolve(basePath, 'packages/plugins/bridge/index.js'),
    '@opentiny/tiny-engine-plugin-tutorial': path.resolve(basePath, 'packages/plugins/tutorial/index.js'),
    '@opentiny/tiny-engine-plugin-robot': path.resolve(basePath, 'packages/plugins/robot/index.js'),
    '@opentiny/tiny-engine-settings-panel': path.resolve(basePath, 'packages/settings/panel/index.js'),
    '@opentiny/tiny-engine-setting-events': path.resolve(basePath, 'packages/settings/events/index.js'),
    '@opentiny/tiny-engine-setting-props': path.resolve(basePath, 'packages/settings/props/index.js'),
    '@opentiny/tiny-engine-setting-styles': path.resolve(basePath, 'packages/settings/styles/index.js'),
    '@opentiny/tiny-engine-toolbar-breadcrumb': path.resolve(basePath, 'packages/toolbars/breadcrumb/index.js'),
    '@opentiny/tiny-engine-toolbar-fullscreen': path.resolve(basePath, 'packages/toolbars/fullscreen/index.js'),
    '@opentiny/tiny-engine-toolbar-lang': path.resolve(basePath, 'packages/toolbars/lang/index.js'),
    '@opentiny/tiny-engine-toolbar-layout': path.resolve(basePath, 'packages/toolbars/layout/index.js'),
    '@opentiny/tiny-engine-toolbar-lock': path.resolve(basePath, 'packages/toolbars/lock/index.js'),
    '@opentiny/tiny-engine-toolbar-logo': path.resolve(basePath, 'packages/toolbars/logo/index.js'),
    '@opentiny/tiny-engine-toolbar-logout': path.resolve(basePath, 'packages/toolbars/logout/index.js'),
    '@opentiny/tiny-engine-toolbar-media': path.resolve(basePath, 'packages/toolbars/media/index.js'),
    '@opentiny/tiny-engine-toolbar-preview': path.resolve(basePath, 'packages/toolbars/preview/index.js'),
    '@opentiny/tiny-engine-toolbar-generate-code': path.resolve(basePath, 'packages/toolbars/generate-code/index.js'),
    '@opentiny/tiny-engine-toolbar-refresh': path.resolve(basePath, 'packages/toolbars/refresh/index.js'),
    '@opentiny/tiny-engine-toolbar-redoundo': path.resolve(basePath, 'packages/toolbars/redoundo/index.js'),
    '@opentiny/tiny-engine-toolbar-clean': path.resolve(basePath, 'packages/toolbars/clean/index.js'),
    '@opentiny/tiny-engine-toolbar-save': path.resolve(basePath, 'packages/toolbars/save/index.js'),
    '@opentiny/tiny-engine-toolbar-setting': path.resolve(basePath, 'packages/toolbars/setting/index.js'),
    '@opentiny/tiny-engine-toolbar-collaboration': path.resolve(basePath, 'packages/toolbars/collaboration/index.js'),
    '@opentiny/tiny-engine-theme-dark': path.resolve(basePath, 'packages/theme/dark/index.less'),
    '@opentiny/tiny-engine-theme-light': path.resolve(basePath, 'packages/theme/light/index.less'),
    '@opentiny/tiny-engine-theme-base': path.resolve(basePath, 'packages/theme/base/src/index.js'),
    '@opentiny/tiny-engine-svgs': path.resolve(basePath, 'packages/svgs/index.js'),
    '@opentiny/tiny-engine-canvas/render': path.resolve(basePath, 'packages/canvas/render/index.js'),
    '@opentiny/tiny-engine-canvas': path.resolve(basePath, 'packages/canvas/index.js'),
    '@opentiny/tiny-engine-utils': path.resolve(basePath, 'packages/utils/src/index.js'),
    '@opentiny/tiny-engine-webcomponent-core': path.resolve(basePath, 'packages/webcomponent/src/lib.js'),
    '@opentiny/tiny-engine-i18n-host': path.resolve(basePath, 'packages/i18n/src/lib.js'),
    '@opentiny/tiny-engine-builtin-component': path.resolve(basePath, 'packages/builtinComponent/index.js'),
    '@opentiny/tiny-engine-meta-register': path.resolve(basePath, 'packages/register/src/index.js'),
    '@opentiny/tiny-engine-layout': path.resolve(basePath, 'packages/layout/index.js'),
    '@opentiny/tiny-engine-configurator': path.resolve(basePath, 'packages/configurator/src/index.js'),
    '@opentiny/tiny-engine-block-compiler': path.resolve(basePath, 'packages/block-compiler/src/index.ts')
  }
}

const getThemePath = (theme, useSourceAlias) => {
  if (!['light', 'dark'].includes(theme)) {
    return ''
  }

  if (useSourceAlias) {
    const basePath = useSourceAlias.basePath || path.resolve(process.cwd(), '..')
    return path.resolve(basePath, `packages/theme/${theme}/index.less`)
  }

  return path.resolve(process.cwd(), `./node_modules/@opentiny/tiny-engine-theme-${theme}/dist/style.css`)
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
              ...getDevAlias(useSourceAlias),
              '@opentiny/tiny-engine-theme': getThemePath(env.VITE_THEME, useSourceAlias)
            }
          }
        }
      }

      if (command === 'build') {
        return {
          resolve: {
            alias: {
              // 构建不使用 alias
              '@opentiny/tiny-engine-theme': getThemePath(env.VITE_THEME, false)
            }
          }
        }
      }
    }
  }
}
