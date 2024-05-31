<template>
  <div id="data-source">
    <div class="data-source-left-panel">
      <div class="title">
        <span>
          <span>{{ registry.title || '状态管理' }}</span>
          <link-button :href="docsUrl"></link-button>
        </span>
        <close-icon @close="close"></close-icon>
      </div>
      <tiny-tabs v-model="state.activeName" @click="tabClick" tab-style="button-card">
        <tiny-tab-item
          v-for="(item, index) in registry.metas"
          :key="index"
          :name="item.options.name"
          :title="item.options.title"
        >
        </tiny-tab-item>
      </tiny-tabs>
      <component
        :is="componentsMap[state.activeName]"
        ref="stateRef"
        :activeName="state.activeName"
        :openPanel="openPanel"
        :closePanel="closePanel"
        :isPanelShow="state.isPanelShow"
        :statePanelRef="statePanelRef"
      ></component>
    </div>
    <div v-if="state.isPanelShow" class="data-source-right-panel">
      <div class="header">
        <span>{{ state.panelTitle }}</span>
        <span class="options-wrap">
          <tiny-button type="danger" @click="confirm">保存</tiny-button>
          <close-icon @close="cancel"></close-icon>
        </span>
      </div>
      <div class="state-panel-content" ref="statePanelRef"></div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { Button, Tabs, TabItem } from '@opentiny/vue'
import { useHelp } from '@opentiny/tiny-engine-controller'
import { CloseIcon, LinkButton } from '@opentiny/tiny-engine-common'
import { STATE, OPTION_TYPE } from '../common/js/constants'

export default {
  components: {
    TinyButton: Button,
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    LinkButton,
    CloseIcon
  },
  props: {
    registry: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      isPanelShow: false,
      activeName:props.registry.metas[0].options.name,
      panelTitle: '',
    })

    const docsUrl = useHelp().getDocsUrl('data') // 模块之间共享的数据与方法如何处理？？

    const componentsMap =
      props.registry.metas?.reduce((acc, cur) => {
        acc[cur.options.name] = cur.component
        return acc
      }, {}) || {}

    const stateRef = ref(null)
    const statePanelRef = ref(null)

    // 关闭插件
    const close = () => {
      emit('close')
      stateRef.value.cancel?.()
    }

    // 关闭新建/编辑面板
    const closePanel = () => {
      state.isPanelShow = false
    }

    const tabClick = () => {
      state.isPanelShow = false
    }

    const cancel = () => {
      state.isPanelShow = false
      stateRef.value.cancel?.()
    }

    const openPanel = (panelTitle) => {
      state.panelTitle = panelTitle
      state.isPanelShow = true
    }

    const confirm = () => {
      stateRef.value.confirm?.()
    }

    return {
      STATE,
      OPTION_TYPE,
      docsUrl,
      stateRef,
      componentsMap,
      state,
      statePanelRef,
      close,
      closePanel,
      openPanel,
      cancel,
      confirm,
      tabClick,
    }
  }
}
</script>

<style lang="less" scoped>
#data-source {
  height: 100%;
  position: relative;

  .data-source-left-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .title {
      padding: 10px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
        'Helvetica Neue', sans-serif;
      color: var(--ti-lowcode-plugin-panel-title-color);
      font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
      border-bottom: 1px solid var(--ti-lowcode-data-header-border-bottom-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    & > span {
      display: inline-block;
      padding: 0 10px;
      &,
      .left-btn,
      :deep(.tiny-popover__reference) {
        width: 100%;
      }
    }
    .left-btn {
      max-width: 100%;
      margin-top: 12px;
    }
  }

  .data-source-right-panel {
    width: 492px;
    height: 100%;
    border-right: 1px solid var(--ti-lowcode-toolbar-border-color);
    background: var(--ti-lowcode-common-component-bg);
    position: absolute;
    left: var(--base-left-panel-width);
    top: 0;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 45px;
      padding: 0 12px;
      color: var(--ti-lowcode-toolbar-icon-color);
      background: var(--ti-lowcode-common-component-bg);
      border-bottom: 1px solid var(--ti-lowcode-data-header-border-bottom-color);
      .options-wrap {
        display: flex;
        column-gap: 16px;
        align-items: center;
      }
    }
  }

  :deep(.tiny-tabs__header) {
    padding: 8px;
  }

  :deep(.tiny-tabs__header .tiny-tabs__active-bar) {
    bottom: auto;
    top: 0;
    height: 2px;
    background-color: transparent;
  }

  :deep(.tiny-tabs__header .tiny-tabs__nav-wrap::after) {
    content: none;
  }

  :deep(.tiny-tabs__item) {
    flex: 1 1 auto;
    text-align: center;
    color: var(--ti-lowcode-common-primary-text-color);
    &:not(.is-active) {
      background-color: var(--ti-lowcode-data-radio-group-bg);
    }
  }

  :deep(.tiny-tabs__nav) {
    float: none;
    display: flex;
    flex-wrap: wrap;
    .tiny-tabs__item {
      &.is-active {
        background-color: var(--ti-lowcode-data-radio-group-active-bg);
      }
    }
  }

  :deep(.tiny-tabs__content) {
    margin: 0;
    padding: 0;
  }
}
</style>
