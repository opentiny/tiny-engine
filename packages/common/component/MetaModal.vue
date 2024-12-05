<template>
  <div v-if="modal.created" v-show="modal.show" class="modal-wrapper">
    <div class="modal-mask" @click="close"></div>
    <div class="modal-content" :style="{ width: width + 'px' }">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'

const modal = reactive({
  show: false,
  created: false
})
export const useModal = () => {
  const openModal = () => {
    if (!modal.created) {
      modal.created = true
    }
    modal.show = true
  }

  const closeModal = () => {
    modal.show = false
  }

  return { openModal, closeModal }
}

export default {
  props: {
    width: {
      type: Number,
      default: 239
    },
    top: {
      type: Number,
      default: 0
    }
  },
  setup(props, { emit }) {
    const { closeModal } = useModal()

    const close = () => {
      closeModal()
      emit('close')
    }

    return {
      close,
      modal
    }
  }
}
</script>

<style lang="less" scoped>
.modal-wrapper {
  position: fixed;
  z-index: 999;
  height: calc(100% - var(--base-top-panel-height));
  right: var(--base-right-panel-width);
  top: var(--base-top-panel-height);
  .modal-mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
  }

  .modal-content {
    padding: 8px;
    color: var(--te-common-text-secondary);
    border: 1px solid var(--ti-lowcode-tabs-border-color);
    border-radius: 4px;
    background-color: var(--ti-lowcode-toolbar-bg);
    overflow: auto;
    max-height: 100%;
  }
}
</style>
