<template>
  <div class="">
    <tiny-popover width="140" trigger="click">
      <template #reference>
        <span class="toolbar-ellipsis">
          <svg-icon name="ellipsis"></svg-icon>
        </span>
      </template>
      <div class="empty-bar" v-for="item in state.hidesbar" :key="item.id">
        <div class="toolbar-list">
          <component :is="item.entry"></component>
        </div>
        <div v-if="item.classifyLine" class="empty-line"></div>
      </div>
    </tiny-popover>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Popover } from '@opentiny/vue'
import { IconPopup } from '@opentiny/vue-icon'

export default {
  components: {
    TinyPopover: Popover,
    IconPopup: IconPopup()
  },
  props: {
    hidesBar: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const state = reactive({
      hidesbar: props.hidesBar
    })
    return {
      state
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

  &:hover {
    background: var(--ti-lowcode-toolbar-view-active-bg);
  }
}

.empty-bar {
  font-size: 12px;

  .toolbar-list {
    padding-top: 4px;
    box-sizing: border-box;
    height: 24px;

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
