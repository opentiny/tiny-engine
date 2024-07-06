<!-- 右侧插件栏,需要将下方的tabs改成DesignPlugins里插件菜单的方式 -->
<template>
  <div>
    <div id="tiny-engine-nav-panel">
      <!-- 图标菜单上侧区域（主要icon） -->
      <ul class="nav-panel-lists">
        <li
          v-for="(item, index) in state.leftList"
          :key="index"
          :class="{
            'list-item': true,
            'first-item': index === 0,
            active: item.name === renderPanel
          }"
          :title="item.title"
          @click="clickMenu({ item, index })"
        >
          <div>
            <span class="item-icon">
              <svg-icon
                v-if="iconComponents[item.name]"
                :name="iconComponents[item.name]"
                class="panel-icon"
              ></svg-icon>
              <component v-else :is="iconComponents[item.name]" class="panel-icon"></component>
            </span>
          </div>
        </li>
      </ul>
    </div>
    <!-- 插件面板 -->
    <div v-show="renderPanel && components[renderPanel]" id="tiny-engine-right-panel">
      <div class="right-panel-wrap">
        <component :is="components[renderPanel]"></component>
        <div v-show="activating" class="active2" />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, toRefs, watch, reactive } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { Tabs, TabItem } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
import Addons from '@opentiny/tiny-engine-app-addons'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyPopover: Popover,
    TinyTooltip: Tooltip
  },
  props: {
    renderPanel: {
      type: String
    }
  },

  setup(props) {
    const { renderPanel } = toRefs(props)
    const { layoutState } = useLayout()
    const settings = Addons && Addons.settings
    const components = {}
    const iconComponents = {}
    const activating = computed(() => layoutState.settings.activating) //高亮显示
    const showMask = ref(true)

    Addons.settings.forEach(({ name, component, icon }) => {
      components[name] = component
      iconComponents[name] = icon
    })

    const state = reactive({
      leftList: settings.filter((item) => item.align === 'left')
    })

    //点击右侧菜单icon按钮
    const clickMenu = ({ item }) => {
      if (layoutState.settings.render == item.name) {
        setRender(null)
        return
      }
      setRender(item.name)
    }

    //待setting组件封装完 备用
    const close = () => {
      useLayout().closeSetting(true)
    }

    const setRender = (curName) => {
      layoutState.settings.render = curName
    }
    watch(renderPanel, (n) => {
      setRender(n)
    })

    return {
      state,
      showMask,
      settings,
      activating,
      layoutState,
      components,
      iconComponents,
      clickMenu,
      renderPanel
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine-right-panel {
  width: var(--base-right-panel-width);
  height: calc(100vh - var(--base-top-panel-height));
  border-right: 1px solid var(--ti-lowcode-plugin-setting-panel-border-left-color);
  background: var(--ti-lowcode-common-component-bg);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: var(--base-nav-panel-width);
  z-index: 999;
  padding: 20px 10px 0 10px;

  &.I18n {
    width: auto;
  }

  &.is-fixed {
    position: relative;
    top: 0;
    left: 0;
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
    height: 100vh;

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
</style>

