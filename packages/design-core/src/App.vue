<template>
  <!-- 在App.vue中进行整体的组装 -->
  <tiny-config-provider :design="designSmbConfig">
    <div id="tiny-engine">
      <design-toolbars></design-toolbars>
      <div class="tiny-engine-main">
        <div class="tiny-engine-left-wrap">
          <design-plugins
            ref="left"
            v-if="leftMenuShownStorage"
            :render-panel="plugins.render"
            @changeLeftAlign="changeLeftAlign"
            @click="toggleNav"
          ></design-plugins>
        </div>
        <div class="tiny-engine-content-wrap">
          <design-canvas></design-canvas>
        </div>
        <div class="tiny-engine-right-wrap">
          <design-settings
            ref="right"
            v-if="rightMenuShownStorage"
            :render-panel="settings.render"
            v-show="layoutState.settings.showDesignSettings"
            @changeRightAlign="changeRightAlign"
          ></design-settings>
        </div>
      </div>
    </div>
  </tiny-config-provider>
</template>

<script>
import { reactive, ref, watch, onUnmounted } from 'vue'
import { ConfigProvider as TinyConfigProvider } from '@opentiny/vue'
import designSmbConfig from '@opentiny/vue-design-smb'
import {
  useResource,
  useLayout,
  useEditorInfo,
  useModal,
  useApp,
  useNotify,
  useCanvas
} from '@opentiny/tiny-engine-controller'
import AppManage from '@opentiny/tiny-engine-plugin-page'
import { isVsCodeEnv } from '@opentiny/tiny-engine-controller/js/environments'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignCanvas from './DesignCanvas.vue'
import DesignSettings from './DesignSettings.vue'
import addons from '@opentiny/tiny-engine-app-addons'
import blockPlugin from '@opentiny/tiny-engine-plugin-block'
import materials from '@opentiny/tiny-engine-plugin-materials'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'
const { message } = useModal()
const { requestInitBlocks } = blockPlugin.api
const { fetchGroups } = materials.api
const { BROADCAST_CHANNEL } = constants

export default {
  name: 'TinyLowCode',
  components: {
    DesignToolbars,
    DesignPlugins,
    DesignCanvas,
    DesignSettings,
    TinyConfigProvider
  },
  provide() {
    return {
      editor: this
    }
  },

  setup() {
    const state = reactive({
      globalClass: '',
      rightWidth: '',
      leftWidfth: '',
      preNode: AppManage,
      jsClose: null
    })

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

    const { layoutState, leftMenuShownStorage, rightMenuShownStorage } = useLayout()
    const { plugins, settings } = layoutState
    const left = ref(null)
    const right = ref(null)

    const changeLeftAlign = (pluginId) => {
      right.value.changeAlign(pluginId)
    }
    const changeRightAlign = (pluginId) => {
      left.value.changeAlign(pluginId)
    }

    // 此处接收画布内部的错误和警告提示
    const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.Notify })

    watch(data, (options) => useNotify(options))

    watch(
      () => state.jsClose,
      () => {
        if (state.preNode) {
          plugins.render = state.preNode.id
        }
      }
    )

    //点击icon菜单
    const toggleNav = ({ item, navLists }) => {
      if (navLists) state.preNode = navLists

      if (!item.id) return

      plugins.render = plugins.render === item.id ? null : item.id
    }

    useEditorInfo().getUserInfo()

    watch(
      useCanvas().isCanvasApiReady,
      (ready) => {
        if (ready) {
          useResource().fetchResource()
        }
      },
      {
        immediate: true
      }
    )

    const handlePopStateEvent = () => {
      useResource().handlePopStateEvent()
    }

    window.addEventListener('popstate', handlePopStateEvent)

    if (isVsCodeEnv) {
      const appId = useApp().appInfoState.selectedId
      fetchGroups(appId)
        .then((groups) => {
          const blocks = []
          groups.forEach((group) => {
            blocks.push(...group.blocks)
          })
          requestInitBlocks(blocks)
        })
        .catch((error) => {
          message({ message: error.message, status: 'error' })
        })
    }

    onUnmounted(() => {
      window.removeEventListener('popstate', handlePopStateEvent)
    })
    return {
      state,
      left,
      right,
      plugins,
      settings,
      toggleNav,
      addons,
      layoutState,
      designSmbConfig,
      changeLeftAlign,
      changeRightAlign,
      leftMenuShownStorage,
      rightMenuShownStorage
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine {
  display: flex;
  flex-flow: column;
  min-width: var(--base-min-width);
  height: 100vh;
  overflow: hidden;
  .tiny-engine-main {
    display: flex;
    flex: 1;
    overflow-y: hidden;
  }
  .tiny-engine-left-wrap {
    display: flex;
    flex-flow: row nowrap;
    z-index: 4;
  }
  .tiny-engine-content-wrap {
    display: flex;
    max-width: 100vw;
    flex: 1;
    position: relative;
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
