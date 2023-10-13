<template>
  <div :class="['tip', type]">
    <div class="left">
      <slot name="icon">
        <icon-info class="icon"></icon-info>
      </slot>
    </div>
    <div class="middle">
      <slot name="content"></slot>
    </div>
    <div class="right">
      <slot name="more"></slot>
    </div>
  </div>
</template>

<script>
import { iconInfo } from '@opentiny/vue-icon'

export default {
  components: {
    IconInfo: iconInfo()
  },
  props: {
    type: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped lang="less">
.tip {
  display: flex;
  border: 1px solid var(--ti-lowcode-toolbar-border-color);
  border-left: 2px solid var(--ti-lowcode-success-border-color);
  border-radius: 0 4px 4px 0;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--ti-lowcode-toolbar-view-hover-bg);

  .left {
    width: 20px;
  }
  .middle {
    flex: 1;
    margin-right: 10px;
  }
  .right {
    width: 50px;
  }
}
.waring {
  border-left: 2px solid var(--ti-lowcode-description-warning-color);
}
.error {
  border-left: 2px solid var(--ti-lowcode-description-error-color);
}
</style>
