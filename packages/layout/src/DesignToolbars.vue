<template>
  <div class="tiny-engine-toolbar">
    <div class="toolbar-left">
      <component :is="item.entry" v-for="item in state.leftBar" :key="item.id"></component>
    </div>
    <div class="toolbar-center">
      <component :is="item.entry" v-for="item in state.centerBar" :key="item.id"></component>
    </div>
    <div class="toolbar-right">
      <div class="toolbar-right-content">
        <div class="toolbar-right-item" v-for="(item, idx) in state.rightBar" :key="idx">
          <div class="toolbar-right-item-comp" v-for="comp in item" :key="comp">
            <component :is="getMergeRegistry(REGISTRY_NAME, comp).entry"></component>
          </div>

          <span class="toolbar-right-line" v-if="layoutRegistry.options.isShowLine">|</span>
        </div>
      </div>
      <toolbar-collapse
        :collapseBar="state.collapseBar"
        :registry="REGISTRY_NAME"
        v-if="layoutRegistry.options.isShowCollapse"
      ></toolbar-collapse>
    </div>
  </div>
  <div class="progress">
    <progress-bar v-if="state.showDeployBlock"></progress-bar>
  </div>
</template>

<script>
import { reactive, nextTick } from 'vue'
import { getMergeRegistry } from '@opentiny/tiny-engine-meta-register'
import { ProgressBar } from '@opentiny/tiny-engine-common'
import ToolbarCollapse from './ToolbarCollapse.vue'
import { utils } from '@opentiny/tiny-engine-utils'

const { deepClone } = utils

export default {
  components: {
    ProgressBar,
    ToolbarCollapse
  },
  props: {
    toolbars: {
      type: Array,
      default: () => []
    },
    layoutRegistry: {
      type: Object,
      default: () => {}
    }
  },
  setup(props) {
    const REGISTRY_NAME = 'toolbars'
    const registryToolbars = deepClone(props.layoutRegistry?.options?.toolbars)
    const registryRightFlat = registryToolbars.right.flat()
    const registryCollapseFlat = registryToolbars.collapse.flat()

    const state = reactive({
      showDeployBlock: false,
      leftBar: [],
      rightBar: [],
      centerBar: [],
      collapseBar: []
    })

    const getNewRes = (arr, newArr) => {
      let res = []
      newArr.forEach((id) => {
        if (arr.indexOf(id) === -1) {
          res.push(id)
        }
      })

      return res
    }

    props.toolbars.forEach((item) => {
      if (item.align === 'right') {
        item?.collapsed ? state.collapseBar.push(item.id) : state.rightBar.push(item.id)
      } else if (item.align === 'center') {
        state.centerBar.push(item.id)
      } else {
        state.leftBar.push(item.id)
      }
    })

    state.leftBar = Array.from(new Set([...registryToolbars.left, ...state.leftBar])).map((id) =>
      getMergeRegistry(REGISTRY_NAME, id)
    )
    state.centerBar = Array.from(new Set([...registryToolbars.center, ...state.centerBar])).map((id) =>
      getMergeRegistry(REGISTRY_NAME, id)
    )

    const rightRes = getNewRes(registryRightFlat, state.rightBar)
    registryToolbars.right[0] = registryToolbars.right[0] ? [...registryToolbars.right[0], ...rightRes] : state.rightBar
    state.rightBar = registryToolbars.right

    const collapseRes = getNewRes(registryCollapseFlat, state.collapseBar)
    registryToolbars.collapse[0] = registryToolbars.collapse[0]
      ? [...registryToolbars.collapse[0], ...collapseRes]
      : state.collapseBar
    state.collapseBar = registryToolbars.collapse

    nextTick(() => {
      state.showDeployBlock = true
    })

    return {
      REGISTRY_NAME,
      getMergeRegistry,
      state
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-engine-toolbar {
  user-select: none;
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: var(--base-top-panel-height);
  text-align: center;
  background-color: var(--ti-lowcode-common-layout-bg);
  position: relative;
  z-index: 1001;
  border-bottom: 1px solid var(--ti-lowcode-toolbar-border-bottom-color);

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    height: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .toolbar-left,
  .toolbar-right {
    :deep(.icon) {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      vertical-align: middle;
      width: 26px;
      height: 26px;
      border-radius: 4px;
      position: relative;
      svg {
        cursor: pointer;
        font-size: 20px;
        color: var(--ti-lowcode-toolbar-title-color);
      }
    }
  }

  .toolbar-left {
    margin: 0 1px;
    :deep(.icon) {
      background: var(--ti-lowcode-toolbar-view-active-bg);
      svg {
        font-size: 16px;
      }
      &:not(.disabled):hover {
        background: var(--ti-lowcode-toolbar-left-icon-bg-hover);
      }
    }
  }

  .toolbar-right {
    margin: 0 6px;
    margin-right: 24px;
    align-items: center;
    :deep(.icon) {
      &:not(.disabled):hover {
        background: var(--ti-lowcode-toolbar-view-active-bg);
      }
      &.active {
        color: var(--ti-lowcode-common-primary-color);
      }
      &.disabled {
        cursor: not-allowed;
      }
    }
    .toolbar-right-content {
      display: flex;
      .toolbar-right-item {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 2px;
        .toolbar-right-item-comp {
          margin-right: 6px;
        }
      }
    }

    .toolbar-right-line {
      color: var(--ti-lowcode-toolbar-right-line);
      margin: 0 6px;
    }
    .tiny-locales {
      height: 35px;
      padding: 5px 12px;
      font-size: 12px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      :deep(span) {
        color: var(--ti-lowcode-toolbar-icon-color);
        opacity: 0.4;
      }

      &:hover {
        :deep(span) {
          opacity: 0.8;
        }
      }
    }
  }
}
.toolbar-right-content .toolbar-right-item:last-child {
  .toolbar-right-line {
    display: none;
  }
}

@media only screen and (max-width: 1280px) {
  .tiny-engine-toolbar {
    .toolbar-center {
      flex: 1;
      justify-content: center;
    }

    :deep(.top-panel-breadcrumb) {
      width: auto;
    }
  }
}
.progress {
  position: absolute;
  top: var(--base-top-panel-height);
  left: 0;
  width: 100%;
  z-index: 1002;
  :deep(.tiny-progress-bar__innerText) {
    display: none;
  }
}
</style>
