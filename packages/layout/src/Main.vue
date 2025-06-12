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
              :plugins="pluginRegistry"
              :plugin-list="pluginList"
              :render-panel="plugins.render"
              @changeLeftAlign="changeLeftAlign"
              @click="toggleNav"
            ></design-plugins>
            <component :is="canvasEntry"></component>
          </div>
        </div>
        <div class="tiny-engine-right-wrap">
          <design-settings
            v-if="rightMenuShownStorage"
            ref="right"
            :render-panel="settings.render"
            :plugin-list="pluginList"
            @changeRightAlign="changeRightAlign"
          ></design-settings>
        </div>
      </div>
    </div>
  </component>
</template>

<script lang="ts">
/* metaService: engine.layout.Main */
import { ref } from 'vue'
import { useLayout, getMergeMeta, getMergeMetaByType } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignSettings from './DesignSettings.vue'
import meta from '../meta'

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
  setup() {
    const layoutRegistry = getMergeMeta(meta.id)
    const configProvider = layoutRegistry.options.configProvider
    const configProviderDesign = layoutRegistry.options.configProviderDesign
    const { layoutState, leftMenuShownStorage, rightMenuShownStorage, initPluginStorageReactive } = useLayout()
    const { plugins, settings } = layoutState
    const canvasEntry = getMergeMeta('engine.canvas')?.entry
    const pluginRegistry = getMergeMetaByType('plugins')
    // @legacy 旧版本兼容，后续废弃 type: 'setting' 的 plugin，全部改为 type: 'plugins'
    const settingRegistry = getMergeMetaByType('setting')

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
    const pluginList = [...pluginRegistry, ...settingRegistry]
    const plugin = {}

    const { PLUGIN_DEFAULT_WIDTH } = constants

    pluginList.forEach((item) => {
      if (item.id) {
        const widthResizable = item?.widthResizable ?? false

        plugin[item.id] = {
          width: item?.width || PLUGIN_DEFAULT_WIDTH,
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
      layoutState,
      canvasEntry,
      pluginRegistry
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
