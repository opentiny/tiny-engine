<!-- 右侧插件栏-->
<template>
  <!-- 插件面板 -->
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
    </div>
  </div>
  <!-- 图标菜单 -->
  <div id="tiny-engine-nav-panel">
    <vue-draggable-next id="rightTop" v-model="state.leftList" class="nav-panel-lists" group="plugins" @end="onEnd">
      <div
        v-for="(item, index) in state.leftList"
        :key="index"
        :class="['list-item', { 'first-item': item === state.leftList[0], active: item.id === renderPanel }]"
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

  <right-menu
    ref="rightMenu"
    :list="state.leftList"
    :align="PLUGIN_POSITION.rightTop"
    @switchAlign="switchAlign"
  ></right-menu>
</template>

<script>
import { computed, ref, toRefs, watch, reactive } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import { getPlugin, getPluginById } from '../config/plugin.js'
import { VueDraggableNext } from 'vue-draggable-next'
import RightMenu from './RightMenu.vue'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    VueDraggableNext,
    RightMenu
  },
  props: {
    renderPanel: {
      type: String
    }
  },
  emits: ['changeRightAlign'],
  setup(props, { emit }) {
    const components = {}
    const iconComponents = {}
    const { renderPanel } = toRefs(props)
    const {
      PLUGIN_POSITION,
      rightFixedPanelsStorage,
      registerPluginApi,
      changeRightFixedPanels,
      getPluginsByLayout,
      dragPluginLayout,
      isSameSide,
      getPluginShown,
      getMoveDragBarState,
      layoutState: { settings: settingsState }
    } = useLayout()

    const rightMenu = ref(null)
    const showContextMenu = (event, type, item, index, align) => {
      if (!type) {
        rightMenu.value.showContextMenu(event.clientX, event.clientY, type)
      } else {
        rightMenu.value.showContextMenu(event.clientX, event.clientY, type, item, index, align)
      }
    }

    const plugins = getPluginsByLayout().map((pluginName) => getPlugin(pluginName))
    plugins.forEach(({ id, component, api, icon }) => {
      components[id] = component
      iconComponents[id] = icon
      if (api) {
        registerPluginApi({
          [id]: api
        })
      }
    })

    const state = reactive({
      leftList: getPluginsByLayout(PLUGIN_POSITION.rightTop).map((pluginName) => getPlugin(pluginName))
    })

    const close = () => {
      useLayout().closeSetting(true)
    }

    const switchAlign = (index, id, list, align) => {
      state.leftList.splice(index, 1)
      emit('changeRightAlign', id)
      dragPluginLayout(list, align, index, 0)
    }
    const activating = computed(() => settingsState.activating) //高亮显示
    const showMask = ref(true)

    const changeAlign = (pluginId) => {
      const item = getPluginById(pluginId)
      state.leftList.unshift(item)
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

    return {
      state,
      showMask,
      activating,
      settingsState,
      components,
      iconComponents,
      clickMenu,
      close,
      fixPanel,
      rightFixedPanelsStorage,
      onEnd,
      showContextMenu,
      changeAlign,
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

#tiny-engine-nav-panel {
  display: none;
  width: var(--base-nav-panel-width);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--ti-lowcode-common-layout-bg);
  box-sizing: border-box;
  z-index: 1000;
  border-left: 1px solid var(--ti-lowcode-plugin-panel-border-right-color);

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

    .list-item {
      width: 100%;
      padding: 3px 0;

      &:first-child {
        padding-top: 16px;
      }

      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      &:hover,
      &.active {
        .item-icon {
          background: var(--ti-lowcode-left-panel-active-bg);
          border-radius: 6px;
        }
      }

      &.active {
        position: relative;

        .item-icon {
          color: var(--ti-lowcode-common-primary-color);
        }
      }

      &.prev {
        border-bottom-color: var(--ti-lowcode-left-panel-active-border-color);
      }
    }

    .item-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--ti-lowcode-design-plugin-color);
      font-size: 22px;
      width: 32px;
      height: 32px;

      svg {
        font-size: 22px;
      }

      .chatgpt-icon {
        width: 18px;
        height: 18px;
      }
    }
  }
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

.ghost {
  opacity: 0.5;
  background: #f2f2f2;
}
.not-selected {
  user-select: none;
}
</style>
