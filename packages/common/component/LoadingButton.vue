<template>
  <tiny-button type="info" @click="$emit('save')" :disabled="disabled || loading">
    <span>
      <svg-icon v-if="loading" class="loading-svg" name="loading"></svg-icon>
      {{ text }}
    </span>
  </tiny-button>
</template>

<script>
import { Button } from '@opentiny/vue'
export default {
  components: {
    TinyButton: Button
  },
  props: {
    text: {
      type: String,
      default: '保存'
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save']
}
</script>

<style lang="less" scoped>
.is-disabled {
  background-color: var(--ti-lowcode-button-info-bg-color) !important;
  opacity: 0.8;
}
.loading-svg {
  color: #fff;
  margin-right: 4px;
  @keyframes loading {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  animation: loading 1s linear infinite;
}
</style>
