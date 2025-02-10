<template>
  <component :is="configProvider" :design="configProviderDesign">
    <div id="tiny-engine">
      <design-toolbars :layoutRegistry="layoutRegistry"></design-toolbars>
      <div class="tiny-engine-main">
        <div class="tiny-engine-left-wrap">
          <div class="tiny-engine-content-wrap">
            <design-plugins
              :plugins="registry.plugins"
              :render-panel="plugins.render"
              @click="toggleNav"
            ></design-plugins>
            <component :is="registry.canvas.entry"></component>
          </div>
        </div>
        <div class="tiny-engine-right-wrap">
          <design-settings
            :settings="registry.settings"
            v-show="layoutState.settings.showDesignSettings"
            ref="right"
          ></design-settings>
        </div>
      </div>
    </div>
  </component>
</template>

<script>
import { useLayout, getMergeRegistry } from '@opentiny/tiny-engine-meta-register'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignSettings from './DesignSettings.vue'
import meta from '../meta'
import { addons } from '@opentiny/tiny-engine'

export default {
  name: 'TinyLowCode',
  components: {
    DesignToolbars,
    DesignPlugins,
    DesignSettings
  },
  provide() {
    return {
      editor: this
    }
  },
  props: {
    registry: {
      type: Object
    }
  },
  setup() {
    const layoutRegistry = getMergeRegistry(meta.type)
    const configProvider = layoutRegistry.options.configProvider
    const configProviderDesign = layoutRegistry.options.configProviderDesign

    // Step 1: 收集插件的 align 信息
    const alignGroups = {}
    const pluginList = addons.plugins

    pluginList.forEach((item) => {
      if (item.id) {
        const align = item.options?.align || 'leftTop'
        if (!alignGroups[align]) {
          alignGroups[align] = []
        }
        alignGroups[align].push(item.id)
      }
    })

    // Step 2: 为每个插件分配 index 值
    const plugin = {}
    pluginList.forEach((item) => {
      if (item.id) {
        const align = item.options?.align || 'leftTop'
        const index = alignGroups[align].indexOf(item.id)

        plugin[item.id] = {
          width: item.options?.width || 300,
          align: align,
          index: index,
          isShow: true
        }
      }
    })
    localStorage.setItem('plugin', JSON.stringify(plugin))

    const { layoutState } = useLayout()
    const { plugins } = layoutState

    const toggleNav = ({ item }) => {
      if (!item.id) return
      plugins.render = plugins.render === item.id ? null : item.id
    }

    return {
      layoutRegistry,
      configProvider,
      configProviderDesign,
      plugins,
      toggleNav,
      layoutState
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine {
  display: flex;
  flex-flow: column;
  min-width: var(--te-base-min-width);
  height: 100vh;
  overflow: hidden;
  .tiny-engine-main {
    display: flex;
    flex: 1;
    overflow-y: hidden;
  }
  .tiny-engine-left-wrap {
    flex: 1 1 0;
    display: flex;
    flex-flow: column nowrap;
    z-index: 4;
    .tiny-engine-content-wrap {
      display: flex;
      max-width: 100vw;
      flex: 1;
    }
  }
  .tiny-engine-right-wrap {
    position: relative;
    z-index: 4;
  }
  :deep(.monaco-editor .suggest-widget) {
    border-width: 0;
  }
}
</style>
