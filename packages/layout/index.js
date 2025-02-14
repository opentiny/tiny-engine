import component from './src/Main.vue'
import metaData from './meta'
import { LayoutService } from './src/composable'
import designSmbConfig from '@opentiny/vue-design-smb'
import { ConfigProvider as TinyConfigProvider } from '@opentiny/vue'
import './src/styles/vars.less'

export default {
  ...metaData,
  component,
  options: {
    configProvider: TinyConfigProvider,
    configProviderDesign: designSmbConfig,
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
        ['engine.toolbars.lang'],
        ['engine.toolbars.viewSetting']
      ]
    }
  },
  metas: [LayoutService]
}

export { LayoutService }
