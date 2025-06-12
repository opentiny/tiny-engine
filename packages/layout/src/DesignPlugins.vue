<!-- 左侧插件栏-->
<template>
  <div id="tiny-engine-nav-panel" :style="{ 'pointer-events': pluginState.pluginEvent }">
    <vue-draggable-next
      v-model="state.topNavLists"
      filter=".panel-icon"
      class="nav-panel-lists top"
      id="leftTop"
      group="plugins"
      @end="onEnd"
    >
      <div
        v-for="(item, index) in state.topNavLists"
        :key="index"
        :class="{
          'list-item': true,
          active: item === renderPanel,
          prev: state.prevIdex - 1 === index
        }"
        :title="getMergeMeta(item)?.title"
        @click="clickMenu({ item: getMergeMeta(item), index })"
        @contextmenu.prevent="showContextMenu($event, true, item, index, PLUGIN_POSITION.leftTop)"
      >
        <div v-if="getPluginShown(item)">
          <span class="item-icon">
            <svg-icon
              v-if="typeof getMergeMeta(item)?.icon === 'string'"
              :name="getMergeMeta(item)?.icon"
              class="panel-icon"
            ></svg-icon>
            <component v-else :is="getMergeMeta(item)?.icon" class="panel-icon"></component>
          </span>
        </div>
      </div>
    </vue-draggable-next>

    <!-- 图标菜单下侧区域（附加icon） -->
    <div class="nav-panel-lists bottom">
      <div style="flex: 1" class="list-item" @contextmenu.prevent="showContextMenu($event, false)" />
      <vue-draggable-next
        id="leftBottom"
        v-model="state.bottomNavLists"
        filter=".panel-icon"
        group="plugins"
        @end="onEnd"
      >
        <div
          v-for="(item, index) in state.bottomNavLists"
          :key="index"
          :class="[
            'list-item',
            {
              active: renderPanel === item,
              prev: state.prevIdex - 1 === index
            }
          ]"
          :title="getMergeMeta(item)?.title"
          @click="clickMenu({ item: getMergeMeta(item), index })"
          @contextmenu.prevent="showContextMenu($event, true, item, index, PLUGIN_POSITION.leftBottom)"
        >
          <div :class="{ 'is-show': renderPanel }" v-if="getPluginShown(item)">
            <span class="item-icon">
              <public-icon
                v-if="typeof getMergeMeta(item)?.icon === 'string'"
                :name="getMergeMeta(item)?.icon"
                class="panel-icon"
                svgClass="panel-svg"
              ></public-icon>
              <component v-else :is="getMergeMeta(item)?.icon" class="panel-icon"></component>
            </span>
          </div>
        </div>
      </vue-draggable-next>
    </div>
  </div>

  <div :class="{ 'not-selected': getMoveDragBarState() }">
    <!-- 插件面板 -->
    <div
      v-show="renderPanel && getMergeMeta(renderPanel)?.entry"
      id="tiny-engine-left-panel"
      :class="[renderPanel, { 'is-fixed': leftFixedPanelsStorage.includes(renderPanel) }]"
    >
      <div class="left-panel-wrap">
        <keep-alive>
          <component
            ref="pluginRef"
            :is="getMergeMeta(renderPanel)?.entry"
            :fixed-panels="leftFixedPanelsStorage"
            @close="close"
            @fixPanel="fixPanel"
          ></component>
        </keep-alive>
      </div>
    </div>
  </div>

  <plugin-right-menu
    ref="rightMenu"
    :list="[...state.topNavLists, ...state.bottomNavLists]"
    align="left"
    @switchAlign="switchAlign"
  />
</template>

<script lang="ts">
/* metaService: engine.layout.DesignPlugins */
import { reactive, ref, watch } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { VueDraggableNext } from 'vue-draggable-next'
import { useLayout, usePage, META_APP, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { PublicIcon, PluginRightMenu } from '@opentiny/tiny-engine-common'

export default {
  components: {
    PluginRightMenu,
    VueDraggableNext,
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    PublicIcon
  },
  props: {
    renderPanel: {
      type: String,
      default: ''
    },
    plugins: {
      type: Array,
      default: () => []
    },
    pluginList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['click', 'node-click', 'changeLeftAlign'],
  setup(props, { emit }) {
    const pluginRef = ref<any>(null)
    const { isTemporaryPage } = usePage()
    const pluginState = useLayout().getPluginState()
    const {
      changeLeftFixedPanels,
      leftFixedPanelsStorage,
      getPluginById,
      getPluginShown,
      PLUGIN_POSITION,
      getMoveDragBarState,
      isSameSide,
      dragPluginLayout,
      getFinalLayoutConfig
    } = useLayout()
    const rightMenu = ref(null)
    const showContextMenu = (event, type, item, index, align) => {
      if (!type) {
        rightMenu.value.showContextMenu(event.clientX, event.clientY, type)
      } else {
        rightMenu.value.showContextMenu(event.clientX, event.clientY, type, item, index, align)
      }
    }
    const state = reactive({
      prevIdex: -2,
      topNavLists: getFinalLayoutConfig().plugins.left.top,
      bottomNavLists: getFinalLayoutConfig().plugins.left.bottom
    })

    const changeAlign = (pluginId) => {
      const item = getPluginById(props.pluginList, pluginId)
      const existingItemIndex = state.topNavLists.findIndex((plugin) => plugin.id === item.id)

      if (existingItemIndex !== -1) {
        state.topNavLists.splice(existingItemIndex, 1)
      }

      state.topNavLists.unshift(item)
    }

    const clickMenu = ({ item, index }) => {
      if (item.id === META_APP.EditorHelp || item.id === META_APP.Robot) return

      state.prevIdex = index

      // 切换插件与关闭插件时确认
      const lastPlugin = props.plugins.find((item) => item.id === props.renderPanel)
      if (props.renderPanel && lastPlugin?.confirm) {
        const confirmCallback = (result) =>
          result &&
          emit('click', {
            item,
            navLists: item.align === 'leftTop' ? state.topNavLists[index] : state.bottomNavLists[index]
          })

        pluginRef.value?.[lastPlugin.confirm](confirmCallback)
      } else {
        emit('click', {
          item,
          navLists: item.align === 'leftTop' ? state.topNavLists[index] : state.bottomNavLists[index]
        })
      }
    }

    watch(isTemporaryPage, () => {
      if (isTemporaryPage.saved) {
        const pagePanel = state.topNavLists?.find((item) => item.id === META_APP.AppManage) || null
        const pageIndex = state.topNavLists?.findIndex((item) => item.id === META_APP.AppManage) || -1
        if (pagePanel !== props.renderPanel) {
          clickMenu({ item: pagePanel, index: pageIndex })
        }
      }
    })

    const close = () => {
      state.prevIdex = -2
      useLayout().closePlugin(true)
    }

    /**
     * @param index 组件索引
     * @param id 组件 ID, 类似于 'engine.plugins.*'
     * @param from 组件来源
     */
    const switchAlign = (index, id, from) => {
      if (from === PLUGIN_POSITION.leftTop) {
        state.topNavLists.splice(index, 1)
      } else {
        state.bottomNavLists.splice(index, 1)
      }
      emit('changeLeftAlign', id)

      if (!isSameSide(index, 0)) close()
      dragPluginLayout(from, PLUGIN_POSITION.rightTop, index, 0)
    }

    const fixPanel = (pluginName) => {
      changeLeftFixedPanels(pluginName)
    }

    //监听拖拽结束事件
    const onEnd = (e) => {
      if (!isSameSide(e.from.id, e.to.id)) close()
      dragPluginLayout(e.from.id, e.to.id, e.oldIndex, e.newIndex)
    }

    return {
      leftFixedPanelsStorage,
      changeAlign,
      rightMenu,
      PLUGIN_POSITION,
      showContextMenu,
      switchAlign,
      getPluginShown,
      onEnd,
      state,
      clickMenu,
      pluginRef,
      close,
      fixPanel,
      pluginState,
      getMoveDragBarState,
      getMergeMeta
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine-left-panel {
  width: auto !important;
  height: calc(100vh - var(--base-top-panel-height));
  background: var(--te-layout-common-bg-color);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: var(--base-top-panel-height);
  left: var(--base-nav-panel-width);
  z-index: 999;

  &.is-fixed {
    position: relative;
    top: 0;
    left: 0;
  }

  .left-panel-wrap {
    width: 100%;
    height: 100%;
    position: relative;

    :deep(.tiny-tabs__nav.is-show-active-bar) .tiny-tabs__item {
      margin-right: 0;
    }
    :deep(.tiny-tabs.tiny-tabs .tiny-tabs__header .tiny-tabs__nav-wrap-not-separator::after) {
      background-color: transparent;
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
  border-right: 1px solid var(--te-layout-common-border-color);

  &.completed {
    display: block;
  }

  .nav-panel-lists {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;

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
</style>
