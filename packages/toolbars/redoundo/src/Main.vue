<template>
  <span class="redo-undo-wrap">
    <tiny-popover
      trigger="hover"
      :open-delay="1000"
      popper-class="toolbar-right-popover"
      append-to-body
      :content="historyState.back ? '撤销' : '没有要撤销的'"
    >
      <template #reference>
        <span :class="['icon-wrap', 'undo', { disabled: !historyState.back }]" @click="back">
          <svg-icon :name="undoIcon"></svg-icon>
        </span>
      </template>
    </tiny-popover>
    <tiny-popover
      trigger="hover"
      :open-delay="1000"
      popper-class="toolbar-right-popover"
      append-to-body
      :content="historyState.forward ? '恢复' : '没有要恢复的'"
    >
      <template #reference>
        <span :class="['icon-wrap', 'redo', !historyState.forward ? 'disabled' : '']" @click="forward">
          <svg-icon :name="redoIcon"></svg-icon>
        </span>
      </template>
    </tiny-popover>
  </span>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { useHistory } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    undoIcon: {
      type: String,
      default: 'undo'
    },
    redoIcon: {
      type: String,
      default: 'redo'
    }
  },
  setup() {
    return useHistory()
  }
}
</script>

<style lang="less" scoped>
.redo-undo-wrap {
  display: flex;

  :deep(.icon-wrap) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 32px;
    border-radius: 6px;
    svg {
      color: var(--ti-lowcode-toolbar-title-color);
      font-size: 20px;
    }
    &.disabled {
      cursor: not-allowed;
      svg {
        color: var(--ti-lowcode-disabled-color);
      }
    }
    &:not(.disabled):hover {
      background: var(--ti-lowcode-toolbar-view-active-bg);
      svg {
        color: var(--ti-lowcode-toolbar-active-color);
      }
    }
    &.redo {
      margin-left: -5px;
    }
  }
}
</style>
