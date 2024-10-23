<!-- 左侧插件栏-->
<template>
  <div>
    <div id="tiny-engine-nav-panel" :style="{ 'pointer-events': pluginState.pluginEvent }">
      <!-- 图标菜单上侧区域（主要icon） -->
      <vue-draggable-next
        v-model="state.topNavLists"
        filter="EditorHelp"
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
            'first-item': index === 0,
            active: item.id === renderPanel,
            prev: state.prevIdex - 1 === index
          }"
          :title="item.title"
          @click="clickMenu({ item, index })"
          @contextmenu.prevent="showContextMenu($event, true, item, index, PLUGIN_POSITION.leftTop)"
        >
          <div v-if="getPluginShown(item.id)">
            <span class="item-icon">
              <svg-icon
                v-if="typeof iconComponents[item.id] === 'string'"
                :name="iconComponents[item.id]"
                class="panel-icon"
              ></svg-icon>
              <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
            </span>
          </div>
        </div>
      </vue-draggable-next>

      <!-- 图标菜单下侧区域（附加icon） -->
      <div class="nav-panel-lists bottom">
        <div style="flex: 1" class="list-item" @contextmenu.prevent="showContextMenu($event, false)"></div>
        <vue-draggable-next id="leftBottom" v-model="state.bottomNavLists" group="plugins" @end="onEnd">
          <div
            v-for="(item, index) in state.bottomNavLists"
            :key="index"
            :class="[
              'list-item',
              { active: renderPanel === item.id, prev: state.prevIdex - 1 === index, 'first-item': index === 0 }
            ]"
            :title="item.title"
            @click="clickMenu({ item, index })"
            @contextmenu.prevent="showContextMenu($event, true, item, index, PLUGIN_POSITION.leftBottom)"
          >
            <div :class="{ 'is-show': renderPanel }" v-if="getPluginShown(item.id)">
              <span class="item-icon">
                <public-icon
                  v-if="typeof iconComponents[item.id] === 'string'"
                  :name="iconComponents[item.id]"
                  class="panel-icon"
                  svgClass="panel-svg"
                ></public-icon>
                <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
              </span>
            </div>
          </div>
        </vue-draggable-next>
        <div
          v-for="(item, index) in state.fixedNavLists"
          :key="index"
          :class="[
            'list-item',
            { active: renderPanel === item.id, prev: state.prevIdex - 1 === index, 'first-item': index === 0 }
          ]"
          :title="item.title"
          @click="clickMenu({ item, index })"
        >
          <div :class="{ 'is-show': renderPanel }">
            <span class="item-icon">
              <public-icon
                v-if="typeof iconComponents[item.id] === 'string'"
                :name="iconComponents[item.id]"
                class="panel-icon"
                svgClass="panel-svg"
              ></public-icon>
              <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
            </span>
          </div>
        </div>
        <div
          v-if="state.independence"
          :key="state.bottomNavLists.length + 1"
          :class="['list-item']"
          :title="state.independence.title"
          @click="openAIRobot"
        >
          <div>
            <span class="item-icon">
              <img class="chatgpt-icon" src="../assets/AI.png" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div :class="{ 'not-selected': getMoveDragBarState() }">
    <!-- 插件面板 -->
    <div
      v-show="renderPanel && components[renderPanel]"
      id="tiny-engine-left-panel"
      :class="[renderPanel, { 'is-fixed': leftFixedPanelsStorage.includes(renderPanel) }]"
    >
      <div class="left-panel-wrap">
        <keep-alive>
          <component
            :is="components[renderPanel]"
            ref="pluginRef"
            :fixed-panels="leftFixedPanelsStorage"
            @close="close"
            @fixPanel="fixPanel"
          ></component>
        </keep-alive>
      </div>
    </div>
  </div>

  <!--  AI 悬浮窗  -->
  <Teleport to="body">
    <div v-if="robotVisible" class="robot-dialog">
      <keep-alive>
        <component :is="robotComponent" @close-chat="robotVisible = false"></component>
      </keep-alive>
    </div>
  </Teleport>

  <right-menu
    ref="rightMenu"
    :list="[...state.topNavLists, ...state.bottomNavLists]"
    :align="left"
    @switchAlign="switchAlign"
  ></right-menu>
</template>

<script>
import { reactive, ref, watch } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { useLayout, usePage } from '@opentiny/tiny-engine-controller'
import { PublicIcon } from '@opentiny/tiny-engine-common'
import { getPlugin, getPluginById } from '../config/plugin.js'
import { VueDraggableNext } from 'vue-draggable-next'
import RightMenu from './RightMenu.vue'

export default {
  components: {
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    PublicIcon,
    VueDraggableNext,
    RightMenu
  },
  props: {
    renderPanel: {
      type: String
    }
  },
  emits: ['click', 'node-click', 'changeLeftAlign'],
  setup(props, { emit }) {
    // TODO：后续优化
    const components = {}
    const iconComponents = {}
    const pluginRef = ref(null)
    const robotVisible = ref(false)
    const robotComponent = ref(null)
    const { isTemporaryPage } = usePage()
    const HELP_PLUGIN_ID = 'EditorHelp'

    const {
      pluginState,
      registerPluginApi,
      changeLeftFixedPanels,
      leftFixedPanelsStorage,
      getPluginsByLayout,
      PLUGIN_POSITION,
      dragPluginLayout,
      isSameSide,
      getPluginShown,
      closePlugin,
      getMoveDragBarState
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
      prevIdex: -2,
      topNavLists: getPluginsByLayout(PLUGIN_POSITION.leftTop).map((pluginName) => getPlugin(pluginName)),
      bottomNavLists: getPluginsByLayout(PLUGIN_POSITION.leftBottom).map((pluginName) => getPlugin(pluginName)),
      independence: getPluginsByLayout(PLUGIN_POSITION.independence).map((pluginName) => getPlugin(pluginName)),
      fixedNavLists: getPluginsByLayout(PLUGIN_POSITION.fixed).map((pluginName) => getPlugin(pluginName))
    })

    const close = () => {
      state.prevIdex = -2
      closePlugin(true)
    }

    const switchAlign = (index, id, list, align) => {
      list === PLUGIN_POSITION.leftTop ? state.topNavLists.splice(index, 1) : state.bottomNavLists.splice(index, 1)
      emit('changeLeftAlign', id)
      dragPluginLayout(list, align, index, 0)
    }

    const completed = ref(false)

    const changeAlign = (pluginId) => {
      const item = getPluginById(pluginId)
      state.topNavLists.unshift(item)
    }

    const doCompleted = () => {
      if (!completed.value) {
        completed.value = true
        closePlugin()
      }
    }

    const clickMenu = ({ item, index }) => {
      if (item.id === HELP_PLUGIN_ID) return
      state.prevIdex = index

      // 切换插件与关闭插件时确认
      const lastPlugin = plugins.find((item) => item.id === props.renderPanel)
      if (props.renderPanel && lastPlugin?.confirm) {
        const confirmCallback = (result) =>
          result &&
          emit('click', {
            item,
            navLists: item.align === 'top' ? state.topNavLists[index] : state.bottomNavLists[index]
          })

        pluginRef.value?.[lastPlugin.confirm](confirmCallback)
      } else {
        emit('click', {
          item,
          navLists: item.align === 'top' ? state.topNavLists[index] : state.bottomNavLists[index]
        })
      }
    }

    watch(isTemporaryPage, () => {
      if (isTemporaryPage.saved) {
        const pagePanel = state.topNavLists?.find((item) => item.id === 'AppManage') || null
        const pageIndex = state.topNavLists?.findIndex((item) => item.id === 'AppManage') || -1
        if (pagePanel !== props.renderPanel) {
          clickMenu({ item: pagePanel, index: pageIndex })
        }
      }
    })

    const openAIRobot = () => {
      robotComponent.value = components.Robot
      robotVisible.value = !robotVisible.value
    }

    //切换面板状态
    const fixPanel = (pluginName) => {
      changeLeftFixedPanels(pluginName)
    }

    //监听拖拽结束事件
    const onEnd = (e) => {
      if (!isSameSide(e.from.id, e.to.id)) close()
      dragPluginLayout(e.from.id, e.to.id, e.oldIndex, e.newIndex)
    }

    return {
      state,
      clickMenu,
      openAIRobot,
      pluginRef,
      robotVisible,
      robotComponent,
      close,
      fixPanel,
      components,
      iconComponents,
      completed,
      doCompleted,
      pluginState,
      leftFixedPanelsStorage,
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
#tiny-engine-left-panel {
  // width: var(--base-left-panel-width);//让该组件宽度自适应子组件宽度
  height: calc(100vh - var(--base-top-panel-height));
  border-right: 1px solid var(--ti-lowcode-plugin-panel-border-right-color);
  background: var(--ti-lowcode-common-component-bg);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: var(--base-top-panel-height);
  left: var(--base-nav-panel-width);
  z-index: 999;

  &.I18n {
    width: auto;
  }

  &.is-fixed {
    position: relative;
    top: 0;
    left: 0;
  }

  .left-panel-wrap {
    height: 100%;
    max-width: 100vw; /* 确保父组件宽度不超出视口宽度 */
    position: relative;

    :deep(.tiny-tabs__nav.is-show-active-bar) .tiny-tabs__item {
      margin-right: 0;
    }
  }
}

#tiny-engine-nav-panel {
  display: none;
  width: var(--base-nav-panel-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--ti-lowcode-common-layout-bg);
  box-sizing: border-box;
  z-index: 1000;
  border-right: 1px solid var(--ti-lowcode-plugin-panel-border-right-color);

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
      padding-bottom: 80px;
    }

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

.robot-dialog {
  position: fixed;
  width: 700px;
  z-index: 5;
  right: 40px;
  bottom: 40px;
  background-color: var(--ti-lowcode-common-component-bg);
  box-shadow: 0px 0px 12px 0px rgba(0, 0, 0, 0.15);
  border: 1px solid #dbdbdb;
  padding: 10px 20px 30px;
  border-radius: 12px;
}

:deep(.panel-svg) {
  font-size: 22px;
}

:deep(.svg-icon.icon-plugin-icon-plugin-help) {
  font-size: 22px;
}
.not-selected {
  user-select: none;
}
</style>
