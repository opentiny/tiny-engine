<!-- 右侧插件栏 -->
<template>
  <div :class="{ 'not-selected': getMoveDragBarState() }">
    <div
      v-show="renderPanel && components[renderPanel]"
      id="tiny-engine-right-panel"
      :class="[renderPanel, { 'is-fixed': rightFixedPanelsStorage.includes(renderPanel) }]"
    >
      <div class="right-panel-wrap">
        <component
          :is="currentComponent"
          :fixed-panels="rightFixedPanelsStorage"
          @close="close"
          @fixPanel="fixPanel"
        ></component>
        <div v-show="activating" class="active2" />
      </div>
    </div>
  </div>
  <div id="tiny-engine-nav-panel">
    <vue-draggable-next
      id="rightTop"
      v-model="settingPlugins"
      filter=".panel-icon"
      class="nav-panel-lists"
      group="plugins"
      @end="onEnd"
    >
      <div
        v-for="(item, index) in settingPlugins"
        :key="index"
        :class="['list-item', { 'first-item': item === settingPlugins[0], active: item.id === renderPanel }]"
        :title="item.title"
        @click="clickMenu({ item, index })"
        @contextmenu.prevent="showContextMenu($event, true, item, index, PLUGIN_POSITION.rightTop)"
      >
        <span class="item-icon" v-if="getPluginShown(item.id)">
          <svg-icon v-if="iconComponents[item.id]" :name="iconComponents[item.id]" class="panel-icon"></svg-icon>
          <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
        </span>
      </div>
      <div style="flex: 1" class="list-item" @contextmenu.prevent="showContextMenu($event, false)"></div>
    </vue-draggable-next>
  </div>

  <plugin-right-menu
    ref="rightMenu"
    :list="settingPlugins"
    :align="PLUGIN_POSITION.rightTop"
    @switchAlign="switchAlign"
  />
</template>

<script lang="ts">
import { computed, ref, watch, toRefs } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import { VueDraggableNext } from 'vue-draggable-next'
import { PluginRightMenu } from '@opentiny/tiny-engine-common'

export default {
  components: {
    PluginRightMenu,
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    VueDraggableNext
  },
  props: {
    settings: {
      type: Array,
      default: () => []
    },
    renderPanel: {
      type: String
    },
    pluginList: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const components = {}
    const iconComponents = {}

    const {
      getPluginsByPosition,
      getPluginById,
      PLUGIN_POSITION,
      rightFixedPanelsStorage,
      changeRightFixedPanels,
      dragPluginLayout,
      isSameSide,
      getPluginShown,
      getMoveDragBarState,
      layoutState: { settings: settingsState }
    } = useLayout()

    const rightMenu = ref(null)
    const { renderPanel } = toRefs(props)
    const showContextMenu = (event, type, item, index, align) => {
      if (!type) {
        rightMenu.value.showContextMenu(event.clientX, event.clientY, type)
      } else {
        rightMenu.value.showContextMenu(event.clientX, event.clientY, type, item, index, align)
      }
    }

    props.pluginList.forEach(({ id, entry, icon }) => {
      components[id] = entry
      iconComponents[id] = icon
    })

    const settingPlugins = ref(getPluginsByPosition(PLUGIN_POSITION.rightTop, props.pluginList))

    const currentComponent = computed(() => {
      const isExistedComponent = settingPlugins.value.some((item) => item.id === renderPanel.value)
      return isExistedComponent ? components[renderPanel.value] : null
    })

    const close = () => {
      useLayout().closeSetting(true)
    }

    const switchAlign = (index, id, from) => {
      settingPlugins.value.splice(index, 1)
      emit('changeRightAlign', id)
      if (!isSameSide(index, 0)) close()
      dragPluginLayout(from, PLUGIN_POSITION.leftTop, index, 0)
    }

    const changeAlign = (pluginId) => {
      const item = getPluginById(props.pluginList, pluginId)
      const existingItemIndex = settingPlugins.value.findIndex((plugin) => plugin.id === item.id)

      if (existingItemIndex !== -1) {
        settingPlugins.value.splice(existingItemIndex, 1)
      }
      settingPlugins.value.unshift(item)
    }

    const setRender = (curId) => {
      settingsState.render = curId
    }

    //点击右侧菜单icon按钮
    const clickMenu = ({ item }) => {
      if (settingsState.render == item.id) {
        useLayout().closeSetting(true)
        return
      }
      setRender(item.id)
    }

    watch(renderPanel, (n) => {
      setRender(n)
    })

    //切换面板状态
    const fixPanel = (pluginName) => {
      changeRightFixedPanels(pluginName)
    }

    //监听拖拽结束事件
    const onEnd = (e) => {
      if (!isSameSide(e.from.id, e.to.id)) close()
      dragPluginLayout(e.from.id, e.to.id, e.oldIndex, e.newIndex)
    }

    const activating = computed(() => settingsState.activating)
    const showMask = ref(true)

    return {
      currentComponent,
      changeAlign,
      showMask,
      activating,
      settingsState,
      settingPlugins,
      components,
      iconComponents,
      clickMenu,
      close,
      fixPanel,
      rightFixedPanelsStorage,
      onEnd,
      showContextMenu,
      PLUGIN_POSITION,
      getPluginShown,
      switchAlign,
      rightMenu,
      getMoveDragBarState
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine-right-panel {
  height: calc(100vh - var(--base-top-panel-height));
  border-left: 1px solid var(--te-layout-common-border-color);
  background: var(--te-layout-common-bg-color);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: var(--base-top-panel-height);
  right: var(--base-nav-panel-width);
  z-index: 999;

  &.I18n {
    width: auto;
  }

  &.is-fixed {
    position: relative;
    top: 0;
    right: 0;
  }

  .right-panel-wrap {
    width: 100%;
    height: 100%;
    position: relative;
    :deep(.tiny-tabs__nav.is-show-active-bar) .tiny-tabs__item {
      margin-right: 0;
    }
  }
}

#tiny-engine-nav-panel {
  display: none;
  width: var(--base-nav-panel-width);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--te-layout-common-bg-color);
  box-sizing: border-box;
  z-index: 1000;
  border-left: 1px solid var(--te-layout-common-border-color);

  &.completed {
    display: block;
  }

  .nav-panel-lists {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;

    &.bottom {
      flex: 1;
      padding-bottom: 28px;
    }

    .list-item {
      width: 100%;
      padding: 3px 0;

      &:first-child {
        padding-top: 12px;
      }

      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      &:hover,
      &.active {
        .item-icon {
          background: var(--te-layout-common-bg-color-hover);
          border-radius: 4px;
        }
      }

      &.active {
        position: relative;

        .item-icon {
          color: var(--te-layout-common-text-color-secondary-checked);
        }
      }

      &.prev {
        border-bottom-color: var(--te-layout-common-border-color);
      }
    }

    .item-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--te-layout-common-text-color);
      font-size: 22px;
      width: 26px;
      height: 26px;

      svg {
        font-size: 18px;
      }
      .public-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 26px;
        height: 26px;
      }
    }
  }
}

:deep(.panel-svg) {
  font-size: 18px;
}

:deep(.svg-icon.icon-plugin-icon-plugin-help) {
  font-size: 18px;
}

.not-selected {
  pointer-events: none;
  user-select: none;
}

:deep(.svg-icon.icon-plugin-icon-plugin-help) {
  font-size: 22px;
}

//高亮显示动画
.active2 {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  animation: glow 800ms ease-out infinite alternate;
  transition: opacity 1s linear;
}

@keyframes glow {
  0% {
    box-shadow: inset 0px 0px 4px var(--te-layout-panel-active-color);
  }
  100% {
    box-shadow: inset 0px 0px 14px var(--te-layout-panel-active-color);
  }
}
</style>
