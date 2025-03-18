# TinyEngine 主包使用API

主包包名为@opentiny/tiny-engine，主要导出所有扩展插件包模块、元服务、meta-register API等，用户设计器中可以按需引用

导出模块如下：

```js
export { init } from './src/init'

// reexport all plugin, user can import ondemand
export { default as Breadcrumb, BreadcrumbService } from '@opentiny/tiny-engine-toolbar-breadcrumb'
export { default as Fullscreen } from '@opentiny/tiny-engine-toolbar-fullscreen'
export { default as Lang } from '@opentiny/tiny-engine-toolbar-lang'
export { default as Logo } from '@opentiny/tiny-engine-toolbar-logo'
export { default as Lock } from '@opentiny/tiny-engine-toolbar-lock'
export { default as Media } from '@opentiny/tiny-engine-toolbar-media'
export { default as Redoundo, HistoryService } from '@opentiny/tiny-engine-toolbar-redoundo'
export { default as Save } from '@opentiny/tiny-engine-toolbar-save'
export { default as Clean } from '@opentiny/tiny-engine-toolbar-clean'
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
  GlobalService
} from '@opentiny/tiny-engine-common'

export { default as defaultRegistry } from './registry'

export * from '@opentiny/tiny-engine-meta-register'

```

## 使用示例

1. 可以将主包导出的元服务、元应用按需引入到注册表中，如：
```js
// registry.js
import {
  Breadcrumb,
  Fullscreen,
  Lang,
  Logo,
  Lock,
  Media,
  Redoundo,
  Save,
  Clean,
  Preview,
  GenerateCode,
  Refresh,
  Collaboration,
  Materials,
  State,
  Script,
  Tree,
  Help,
  Schema,
  Page,
  I18n,
  Bridge,
  Block,
  Datasource,
  Robot,
  Props,
  Events,
  Styles,
  Layout,
  Canvas,
  GenerateCodeService,
  GlobalService
} from '@opentiny/tiny-engine'
import engineConfig from './engine.config'

export default {
  root: {
    id: 'engine.root',
    metas: [GenerateCodeService, GlobalService]
  },
  config: engineConfig,
  layout: {
    ...Layout,
    options: {
      ...Layout.options,
      isShowLine: true,
      isShowCollapse: true,
      toolbars: {
        left: ['engine.toolbars.breadcrumb', 'engine.toolbars.lock', 'engine.toolbars.logo'],
        center: ['engine.toolbars.media'],
        right: [
          ['engine.toolbars.redoundo', 'engine.toolbars.clean'],
          ['engine.toolbars.preview'],
          ['engine.toolbars.generate-code', 'engine.toolbars.save']
        ],
        collapse: [
          ['engine.toolbars.collaboration'],
          ['engine.toolbars.refresh', 'engine.toolbars.fullscreen'],
          ['engine.toolbars.lang']
        ]
      }
    }
  },
  themes: [
    {
      id: 'engine.theme.light'
    },
    {
      id: 'engine.theme.dark'
    }
  ],
  toolbars: [
    Logo,
    Breadcrumb,
    Lock,
    Media,
    Redoundo,
    Collaboration,
    Clean,
    Preview,
    Refresh,
    GenerateCode,
    Save,
    Fullscreen,
    Lang
  ],
  plugins: [Materials, Tree, Page, Block, Datasource, Bridge, I18n, Script, State, Schema, Help, Robot],
  dsls: [{ id: 'engine.dsls.dslvue' }],
  settings: [Props, Styles, Events],
  canvas: Canvas
}

```

2. `defineEntry`：提供了defineEntry函数，作为注册表的注册入口，能够将用户注册表注册到TinyEngine中，如：
```js
import registry from '../registry.js'
import { defineEntry } from '@opentiny/tiny-engine'

defineEntry(registry)

export { registry }

```

3. `getMergeMeta`：提供了在各个元服务、元应用获取到注册表的能力
```js
import { getMergeMeta } from '@opentiny/tiny-engine'

// 获取元应用/元服务注册表
getMergeMeta('engine.config')

// 获取完整注册表
getMergeRegistry()
// 获取类型下所有注册表
getMergeRegistry('toolbars')
// 获取元应用/元服务注册表
getMergeRegistry('toolbars', 'engine.toolbars.lang')
```

4. `getMetaApi`：提供了获取元应用/元服务API的能力

```js
import { getMetaApi } from '@opentiny/tiny-engine'

// 通过getMetaApi获取元应用/元服务API
const { selectNode } = getMetaApi('engine.canvas').canvasApi.value


```

5. `getOptions`：提供了在各个元服务、元应用获取到元服务API的能力
```js
import {  getOptions } from '@opentiny/tiny-engine'

// 通过getOptions获取元应用/元服务配置项
const options = getOptions('engine.canvas')
```