import component from './src/Main.vue'
import metaData from './meta'
import { LayoutService } from './src/composable'
import designSmbConfig from '@opentiny/vue-design-smb'
import { ConfigProvider as TinyConfigProvider } from '@opentiny/vue'
import './src/styles/vars.less'
import mcp from './src/mcp'

export default {
  ...metaData,
  component,
  options: {
    configProvider: TinyConfigProvider,
    configProviderDesign: designSmbConfig,
    isShowLine: true,
    isShowCollapse: true
  },
  metas: [LayoutService],
  mcp
}

export { LayoutService }
