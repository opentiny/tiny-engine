<template>
  <div>
    <tiny-popover width="140" trigger="click" popper-class="toolbar-collapse-popover">
      <template #reference>
        <span class="toolbar-ellipsis">
          <svg-icon name="ellipsis"></svg-icon>
        </span>
      </template>
      <div class="empty-bar" v-for="item in collapseBar" :key="item.id">
        <div v-if="item.splitLine" class="empty-line"></div>
        <div class="toolbar-list-button">
          <component :is="item.entry"></component>
        </div>
      </div>
    </tiny-popover>
  </div>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { IconPopup } from '@opentiny/vue-icon'

export default {
  components: {
    TinyPopover: Popover,
    IconPopup: IconPopup()
  },
  props: {
    collapseBar: {
      type: Array,
      default: () => []
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
