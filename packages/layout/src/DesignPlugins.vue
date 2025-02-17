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
    </ul>
  </div>

  <div
    v-show="renderPanel && components[renderPanel]"
    id="tiny-engine-left-panel"
    :class="[renderPanel, { 'is-fixed': pluginState.fixedPanels.includes(renderPanel) }]"
  >
    <div class="left-panel-wrap">
      <keep-alive>
        <component
          :is="components[renderPanel]"
          ref="pluginRef"
          :fixed-panels="pluginState.fixedPanels"
          @close="close"
          @fixPanel="fixPanel"
        ></component>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import { reactive, ref, watch } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { useLayout, usePage, useModal, META_APP } from '@opentiny/tiny-engine-meta-register'
import { PublicIcon } from '@opentiny/tiny-engine-common'
import { constants } from '@opentiny/tiny-engine-utils'

const { STORAGE_KEY_FIXED_PANELS } = constants

export default {
  components: {
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    PublicIcon
  },
  props: {
    renderPanel: {
      type: String
    },
    plugins: {
      type: Array,
      default: () => []
    }
  },
  emits: ['click', 'node-click'],
  setup(props, { emit }) {
    const components = {}
    const iconComponents = {}
    const pluginRef = ref(null)
    const { isTemporaryPage } = usePage()
    const { message } = useModal()
    const pluginState = useLayout().getPluginState()

    props.plugins.forEach(({ id, entry, icon }) => {
      components[id] = entry
      iconComponents[id] = icon
    })

    const state = reactive({
      prevIdex: -2,
      topNavLists: props.plugins.filter((item) => item.align === 'top'),
      bottomNavLists: props.plugins.filter((item) => item.align === 'bottom')
    })

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

    const fixPanel = (pluginName) => {
      pluginState.fixedPanels = pluginState.fixedPanels?.includes(pluginName)
        ? pluginState.fixedPanels?.filter((item) => item !== pluginName)
        : [...pluginState.fixedPanels, pluginName]

      try {
        localStorage.setItem(STORAGE_KEY_FIXED_PANELS, JSON.stringify(pluginState.fixedPanels))
      } catch (error) {
        message({ message: `'存储固定面板数据失败:'${error}`, status: 'error' })
      }
    }

    const restoreFixedPanels = () => {
      try {
        const storedPanels = localStorage.getItem(STORAGE_KEY_FIXED_PANELS)
        pluginState.fixedPanels = storedPanels ? JSON.parse(storedPanels) : []

        if (!Array.isArray(pluginState.fixedPanels)) {
          pluginState.fixedPanels = []
        }
      } catch (error) {
        message({ message: `'读取固定面板数据失败:'${error}`, status: 'error' })
        pluginState.fixedPanels = []
      }
    }

    restoreFixedPanels()

    return {
      state,
      clickMenu,
      pluginRef,
      close,
      fixPanel,
      pluginState,
      components,
      iconComponents
    }
  }
}
</script>

<style lang="less" scoped>
#tiny-engine-left-panel {
  width: var(--base-left-panel-width);
  height: calc(100vh - var(--base-top-panel-height));
  border-right: 1px solid var(--te-layout-common-border-color);
  background: var(--te-layout-common-bg-color);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: var(--base-top-panel-height);
  left: var(--base-nav-panel-width);
  z-index: 999;

  &[class~='engine.plugins.i18n'] {
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
</style>
