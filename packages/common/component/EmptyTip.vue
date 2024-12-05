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
  border: 1px solid var(--te-common-border-default);
  border-left: 2px solid var(--te-common-color-success);
  border-radius: 0 4px 4px 0;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--te-common-bg-container);

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
  border-left: 2px solid var(--te-common-color-warning);
}
.error {
  border-left: 2px solid var(--te-common-color-error);
}
</style>
