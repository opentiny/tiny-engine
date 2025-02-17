<template>
  <teleport to="body">
    <div v-if="visibleModal" class="mask-modal" @click="$emit('close')">
      <slot></slot>
    </div>
  </teleport>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props) {
    const visibleModal = computed(() => props.visible)

    return {
      visibleModal
    }
  }
}
</script>

<style lang="less" scoped>
.mask-modal {
  position: fixed;
  top: 0;
  left: calc(100% - var(--base-right-panel-width));
  width: var(--base-right-panel-width);
  height: 100%;
  background-color: var(--te-component-mask-modal-bg-color);
  transition: background-color, 0.2s, ease-in-out;
  z-index: 9;
}
</style>
