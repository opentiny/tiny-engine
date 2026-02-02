<template>
  <component :is="configProvider" :design="configProviderDesign">
    <div id="tiny-engign-workspace" v-if="isShowDefaultWorkspace || !!clickedWorkspacePageId">
      <design-workspace
        :workspaceRegistry="workspaceRegistry"
        :currentPageId="clickedWorkspacePageId"
        @backToDesigner="setWorkspacePageId"
      ></design-workspace>
    </div>
    <div id="tiny-engine" v-if="!isShowDefaultWorkspace && !clickedWorkspacePageId">
      <design-toolbars
        :layoutRegistry="layoutRegistry"
        :workspaceRegistry="workspaceRegistry"
        @openWorkspace="setWorkspacePageId"
      ></design-toolbars>
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
        <div class="tiny-engine-right-robot">
          <!-- AI对话框展示 -->
        </div>
      </div>
    </div>
  </component>
</template>

<script lang="ts">
/* metaService: engine.layout.Main */
import { ref, computed } from 'vue'
import { useLayout, getMergeMeta, getMergeMetaByType } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignSettings from './DesignSettings.vue'
import DesignWorkspace from './DesignWorkspace.vue'
import meta from '../meta'

export default {
  name: 'TinyLowCode',
  components: {
    DesignToolbars,
    DesignPlugins,
    DesignSettings,
    DesignWorkspace
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
    const isShowWorkspace = layoutRegistry.options.isShowWorkspace
    const { layoutState, leftMenuShownStorage, rightMenuShownStorage, initPluginStorageReactive } = useLayout()
    const { plugins, settings } = layoutState
    const canvasEntry = getMergeMeta('engine.canvas')?.entry
    const pluginRegistry = getMergeMetaByType('plugins')
    const workspaceRegistry = getMergeMetaByType('workspace')
    // @legacy 旧版本兼容，后续废弃 type: 'setting' 的 plugin，全部改为 type: 'plugins'
    const settingRegistry = getMergeMetaByType('setting')
    // 启用isShowWorkspace = true后，且当url中不包含id=xxx即应用id时自动打开workspace页
    const queryParams = new URLSearchParams(location.search)
    const isShowDefaultWorkspace = computed(() => {
      return isShowWorkspace && queryParams.get('id') === null && workspaceRegistry.length
    })

    // 跳转到workspace模块下的页面的组件ID，如果有则跳转到workspace下页面如应用中心
    const clickedWorkspacePageId = ref('')

    const setWorkspacePageId = (nodeId) => {
      clickedWorkspacePageId.value = nodeId
    }

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
      pluginRegistry,
      workspaceRegistry,
      isShowDefaultWorkspace,
      clickedWorkspacePageId,
      setWorkspacePageId
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
    position: relative;
  }
  :deep(.monaco-editor .suggest-widget) {
    border-width: 0;
  }
}

#tiny-engine-workspace {
  position: absolute;
}
</style>
