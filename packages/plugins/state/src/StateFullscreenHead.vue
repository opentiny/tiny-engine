<template>
  <div class="fullscreen-head-content">
    <span>{{ title }}</span>
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
  color: var(--te-common-text-primary);
  height: 30px;
  line-height: 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
}
</style>
