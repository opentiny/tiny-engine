<template>
  <div>
    <tiny-popover width="140" trigger="click" popper-class="toolbar-collapse-popover">
      <template #reference>
        <span class="toolbar-ellipsis">
          <svg-icon name="ellipsis"></svg-icon>
        </span>
      </template>
      <div class="empty-bar" v-for="(item, idx) in collapseBar" :key="idx">
        <div class="toolbar-list-button" v-for="comp in item" :key="comp">
          <component :is="getMergeRegistry(registry, comp)?.entry"></component>
        </div>
        <div class="empty-line"></div>
      </div>
    </tiny-popover>
  </div>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { IconPopup } from '@opentiny/vue-icon'
import { getMergeRegistry } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyPopover: Popover,
    IconPopup: IconPopup()
  },
  props: {
    collapseBar: {
      type: Array,
      default: () => []
    },
    registry: {
      type: String,
      default: ''
    }
  },
  setup() {
    return {
      getMergeRegistry
    }
  }
}
</script>

<style lang="less">
.toolbar-ellipsis {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  line-height: 24px;
  margin-left: 4px;

  &:hover {
    background: var(--ti-lowcode-toolbar-view-active-bg);
  }
}

.empty-bar {
  font-size: 12px;

  .toolbar-list-button {
    padding-top: 4px;
    box-sizing: border-box;

    &:hover {
      background-color: var(--ti-lowcode-toolbar-ellipsis-hover-bg);
      cursor: pointer;
    }

    .operate-title {
      vertical-align: middle;
    }

    .reference-wrapper {
      padding-left: 8px;
    }
  }

  .empty-line {
    margin: 4px 0px;
    border-top: 1px solid var(--ti-lowcode-canvas-wrap-bg);
  }

  .icon-hides {
    margin-right: 8px;
  }
}
</style>
