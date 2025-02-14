<template>
  <div class="fullscreen-head-content">
    <span class="title">{{ title }}</span>
    <close-icon @close="close"></close-icon>
  </div>
</template>
<script>
import { CloseIcon } from '@opentiny/tiny-engine-common'
export default {
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  components: {
    CloseIcon
  },
  emits: ['close'],
  setup(props, { emit }) {
    const close = () => {
      emit('close')
    }

    return {
      close
    }
  }
}
</script>
<style lang="less" scoped>
.fullscreen-head-content {
  font-size: 12px;
  color: var(--te-state-common-text-color);
  height: 30px;
  line-height: 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  .title {
    font-size: var(--te-base-font-size-base);
    color: var(--te-state-common-text-color);
    font-weight: var(--te-base-font-weight-7);
  }
}
</style>
