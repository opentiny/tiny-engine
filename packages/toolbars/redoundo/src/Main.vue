<template>
  <toolbar-base :options="options">
    <template #default>
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
              <svg-icon :name="options.icon.undo"></svg-icon>
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
              <svg-icon :name="options.icon.redo"></svg-icon>
            </span>
          </template>
        </tiny-popover>
      </span>
    </template>
  </toolbar-base>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { useHistory } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyPopover: Popover,
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
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
      color: var(--te-toolbars-redoundo-text-color);
      font-size: 20px;
    }
    &.disabled {
      cursor: not-allowed;
      svg {
        color: var(--te-toolbars-redoundo-text-color-disabled);
      }
    }
    &:not(.disabled):hover {
      background: var(--te-toolbars-redoundo-bg-color-active);
      svg {
        color: var(--te-toolbars-redoundo-icon-color-hover);
      }
    }
    &.redo {
      margin-left: -5px;
    }
  }
}
</style>
