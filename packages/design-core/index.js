export { init } from './src/init'

// reexport all plugin, user can import ondemand
export { default as Breadcrumb, BreadcrumbService } from '@opentiny/tiny-engine-toolbar-breadcrumb'
export { default as Fullscreen } from '@opentiny/tiny-engine-toolbar-fullscreen'
export { default as Lang } from '@opentiny/tiny-engine-toolbar-lang'
export { default as ViewSetting } from '@opentiny/tiny-engine-toolbar-view-setting'
export { default as Logo } from '@opentiny/tiny-engine-toolbar-logo'
export { default as Lock } from '@opentiny/tiny-engine-toolbar-lock'
export { default as Media } from '@opentiny/tiny-engine-toolbar-media'
export { default as Redoundo, HistoryService } from '@opentiny/tiny-engine-toolbar-redoundo'
export { default as Save } from '@opentiny/tiny-engine-toolbar-save'
export { default as Clean } from '@opentiny/tiny-engine-toolbar-clean'
export { default as ThemeSwitch, ThemeSwitchService } from '@opentiny/tiny-engine-toolbar-theme-switch'
export { default as Preview } from '@opentiny/tiny-engine-toolbar-preview'
export { default as GenerateCode, SaveLocalService } from '@opentiny/tiny-engine-toolbar-generate-code'
export { default as Refresh } from '@opentiny/tiny-engine-toolbar-refresh'
export { default as Collaboration } from '@opentiny/tiny-engine-toolbar-collaboration'
export { default as Setting } from '@opentiny/tiny-engine-toolbar-setting'
export { default as Materials, ResourceService, MaterialService } from '@opentiny/tiny-engine-plugin-materials'
export { default as State } from '@opentiny/tiny-engine-plugin-state'
export { default as Script } from '@opentiny/tiny-engine-plugin-script'
export { default as Tree } from '@opentiny/tiny-engine-plugin-tree'
export { default as Help, HelpService } from '@opentiny/tiny-engine-plugin-help'
export { default as Schema } from '@opentiny/tiny-engine-plugin-schema'
export { default as Page, PageService } from '@opentiny/tiny-engine-plugin-page'
export { default as I18n, TranslateService } from '@opentiny/tiny-engine-plugin-i18n'
export { default as Bridge } from '@opentiny/tiny-engine-plugin-bridge'
export { default as Block, BlockService } from '@opentiny/tiny-engine-plugin-block'
export { default as Datasource, DataSourceService } from '@opentiny/tiny-engine-plugin-datasource'
export { default as Robot } from '@opentiny/tiny-engine-plugin-robot'
export { default as Props, PropertiesService, PropertyService } from '@opentiny/tiny-engine-setting-props'
export { default as Events } from '@opentiny/tiny-engine-setting-events'
export { default as Styles } from '@opentiny/tiny-engine-setting-styles'
export { default as Layout, LayoutService } from '@opentiny/tiny-engine-layout'
export { default as Canvas } from '@opentiny/tiny-engine-canvas'
export { initPreview } from './src/preview/src/main'
export {
  GenerateCodeService,
  PluginPanel,
  PluginSetting,
  ToolbarBase,
  GlobalService,
  HttpService
} from '@opentiny/tiny-engine-common'

export { default as defaultRegistry } from './registry'

export * from '@opentiny/tiny-engine-meta-register'
