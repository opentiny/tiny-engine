<template>
  <component :is="configProvider" :design="configProviderDesign">
    <div id="tiny-engine">
      <design-toolbars :layoutRegistry="layoutRegistry"></design-toolbars>
      <div class="tiny-engine-main">
        <div class="tiny-engine-left-wrap">
          <div class="tiny-engine-content-wrap">
            <design-plugins
              v-if="leftMenuShownStorage"
              ref="left"
              :plugins="registry.plugins"
              :plugin-list="pluginList"
              :render-panel="plugins.render"
              @changeLeftAlign="changeLeftAlign"
              @click="toggleNav"
            ></design-plugins>
            <component :is="registry.canvas.entry"></component>
          </div>
        </div>
        <div class="tiny-engine-right-wrap">
          <design-settings
            v-if="rightMenuShownStorage"
            ref="right"
            :settings="registry.settings"
            :render-panel="settings.render"
            :plugin-list="pluginList"
            v-show="layoutState.settings.showDesignSettings"
            @changeRightAlign="changeRightAlign"
          ></design-settings>
        </div>
      </div>
    </div>
  </component>
</template>

<script>
import { useLayout, getMergeRegistry } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignSettings from './DesignSettings.vue'
import meta from '../meta'
import { ref } from 'vue'

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
  setup(props) {
    const layoutRegistry = getMergeRegistry(meta.type)
    const configProvider = layoutRegistry.options.configProvider
    const configProviderDesign = layoutRegistry.options.configProviderDesign

    const { layoutState, leftMenuShownStorage, rightMenuShownStorage, initPluginStorageReactive } = useLayout()
    const { plugins, settings } = layoutState

    const toggleNav = ({ item }) => {
      if (!item.id) return
      plugins.render = plugins.render === item.id ? null : item.id
    }

    const left = ref(null)
    const right = ref(null)

    const changeLeftAlign = (pluginId) => {
      right.value?.changeAlign(pluginId)
    }
    const changeRightAlign = (pluginId) => {
      left.value?.changeAlign(pluginId)
    }

    // 合并插件和设置列表
    const pluginList = [...props.registry.plugins, ...props.registry.settings]

    // 收集插件的 align 信息
    const alignGroups = {}
    const plugin = {}

    const { PLUGIN_DEFAULT_WIDTH } = constants

    pluginList.forEach((item) => {
      if (item.id) {
        const align = item?.align || 'leftTop'

        // 初始化 alignGroups[align]
        if (!alignGroups[align]) {
          alignGroups[align] = []
        }

        // 将 item.id 推入对应的 alignGroups
        alignGroups[align].push(item.id)

        // 为每个插件分配 index 和相关属性
        const index = alignGroups[align].indexOf(item.id)
        const widthResizable = item?.widthResizable ?? false

        plugin[item.id] = {
          width: item?.width || PLUGIN_DEFAULT_WIDTH,
          align: align,
          index: index,
          isShow: true,
          entry: item.entry,
          id: item.id,
          icon: item.icon,
          widthResizable
        }
      }
    })
    localStorage.setItem('plugin', JSON.stringify(plugin))
    initPluginStorageReactive(plugin)

    return {
      left,
      right,
      changeLeftAlign,
      changeRightAlign,
      leftMenuShownStorage,
      rightMenuShownStorage,
      pluginList,
      layoutRegistry,
      configProvider,
      configProviderDesign,
      plugins,
      settings,
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
    display: flex;
    flex-flow: row nowrap;
    z-index: 4;
  }
  :deep(.monaco-editor .suggest-widget) {
    border-width: 0;
  }
}
</style>
