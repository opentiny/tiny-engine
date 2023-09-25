<template>
  <div id="tiny-engine-nav-panel" :style="{ 'pointer-events': pluginState.pluginEvent }">
    <ul class="nav-panel-lists top">
      <li
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
      >
        <div>
          <span class="item-icon">
            <svg-icon
              v-if="typeof iconComponents[item.id] === 'string'"
              :name="iconComponents[item.id]"
              class="panel-icon"
            ></svg-icon>
            <component v-else :is="iconComponents[item.id]" class="panel-icon"></component>
          </span>
        </div>
      </li>
    </ul>
    <ul class="nav-panel-lists bottom">
      <li style="flex: 1" class="list-item"></li>
      <li
        v-for="(item, index) in state.bottomNavLists"
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
      </li>
      <li
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
      </li>
    </ul>
  </div>

  <div
    v-show="renderPanel && components[renderPanel]"
    id="tiny-engine-left-panel"
    :class="[renderPanel, { 'is-fixed': pluginsState.fixedPanels.includes(renderPanel) }]"
  >
    <div class="left-panel-wrap">
      <keep-alive>
        <component
          :is="components[renderPanel]"
          ref="pluginRef"
          :fixed-panels="pluginsState.fixedPanels"
          @close="close"
          @fixPanel="fixPanel"
        ></component>
      </keep-alive>
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
</template>

<script>
import { reactive, ref, watch } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { useLayout, usePage } from '@opentiny/tiny-engine-controller'
import Addons from '@opentiny/tiny-engine-app-addons'
import { PublicIcon } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    PublicIcon
  },
  props: {
    renderPanel: {
      type: String
    }
  },
  emits: ['click', 'node-click'],
  setup(props, { emit }) {
    const plugins = Addons.plugins
    const components = {}
    const iconComponents = {}
    const pluginRef = ref(null)
    const robotVisible = ref(false)
    const robotComponent = ref(null)
    const { isTemporaryPage } = usePage()

    const {
      pluginState,
      registerPluginApi,
      layoutState: { plugins: pluginsState }
    } = useLayout()

    Addons.plugins.forEach(({ id, component, api, icon }) => {
      components[id] = component
      iconComponents[id] = icon
      if (api) {
        registerPluginApi({
          [id]: api
        })
      }
    })

    const completed = ref(false)

    const state = reactive({
      prevIdex: -2,
      topNavLists: plugins.filter((item) => item.align === 'top'),
      bottomNavLists: plugins.filter((item) => item.align === 'bottom'),
      independence: plugins.find((item) => item.align === 'independence')
    })

    const doCompleted = () => {
      if (!completed.value) {
        completed.value = true
        useLayout().closePlugin()
      }
    }

    const clickMenu = ({ item, index }) => {
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
    const close = () => {
      state.prevIdex = -2
      useLayout().closePlugin(true)
    }

    const fixPanel = (pluginName) => {
      pluginsState.fixedPanels = pluginsState.fixedPanels?.includes(pluginName)
        ? pluginsState.fixedPanels?.filter((item) => item !== pluginName)
        : [...pluginsState.fixedPanels, pluginName]
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
      pluginsState,
      components,
      iconComponents,
      completed,
      doCompleted,
      pluginState
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine-left-panel {
  width: var(--base-left-panel-width, 268px);
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
      padding-bottom: 36px;
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
</style>
