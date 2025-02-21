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
          :is="components[renderPanel]"
          :fixed-panels="rightFixedPanelsStorage"
          @close="close"
          @fixPanel="fixPanel"
        ></component>
        <div v-show="activating" class="active2" />
      </div>
      <div v-if="renderPanel === 'engine.setting.styles'" class="tabs-setting">
        <tiny-tooltip effect="light" :content="isCollapsed ? '展开' : '折叠'" placement="top" :visible-arrow="false">
          <template #default> <svg-icon :name="settingIcon" @click="isCollapsed = !isCollapsed"></svg-icon> </template>
        </tiny-tooltip>
      </div>
    </div>
  </div>
  <div id="tiny-engine-nav-panel">
    <vue-draggable-next id="rightTop" v-model="settingPlugins" class="nav-panel-lists" group="plugins" @end="onEnd">
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
</template>

<script>
import { computed, provide, ref, watch, toRefs } from 'vue'
import { Tabs, TabItem, Tooltip } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import { VueDraggableNext } from 'vue-draggable-next'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyTooltip: Tooltip,
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

    const close = () => {
      useLayout().closeSetting(true)
    }

    const switchAlign = (index, id, list, align) => {
      settingPlugins.value.splice(index, 1)
      emit('changeRightAlign', id)
      dragPluginLayout(list, align, index, 0)
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
    const isCollapsed = ref(false)
    const settingIcon = computed(() => (isCollapsed.value ? 'collapse_all' : 'expand_all'))

    provide('isCollapsed', isCollapsed)

    return {
      showMask,
      isCollapsed,
      activating,
      settingIcon,
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
  border-left: 1px solid var(--ti-lowcode-plugin-panel-border-right-color);
  background: var(--ti-lowcode-common-component-bg);
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

.tabs-setting {
  position: absolute;
  top: 9px;
  right: 78px;
  line-height: 26px;
  color: var(--te-component-common-icon-color-primary);
  cursor: pointer;
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
    box-shadow: inset 0px 0px 4px var(--ti-lowcode-canvas-handle-hover-bg);
  }
  100% {
    box-shadow: inset 0px 0px 14px var(--ti-lowcode-canvas-handle-hover-bg);
  }
}

.not-selected {
  user-select: none;
}
</style>
