<template>
  <teleport to="body">
    <div :style="{ top: modal.top + 'px', left: modal.left + 'px' }" class="modal-wrapper">
      <div class="modal-mask" @click="$emit('close')"></div>
      <div class="modal-content">
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>

<script>
import { reactive } from 'vue'

const modal = reactive({
  left: 0,
  top: 0
})
export const useModal = () => {
  const setPosition = (event) => {
    const panelWidth = window.getComputedStyle(document.body).getPropertyValue('--base-right-panel-width')
    const innnerWidth = window.innerWidth
    const modalHalfWidth = (parseInt(panelWidth) - 24) / 2
    const x = event.x
    const y = event.y
    modal.top = y
    if (x + modalHalfWidth > innnerWidth) {
      modal.left = innnerWidth - (parseInt(panelWidth) - 24)
    } else if (x - modalHalfWidth < innnerWidth - parseInt(panelWidth)) {
      modal.left = innnerWidth - parseInt(panelWidth)
    } else {
      modal.left = x - modalHalfWidth
    }
  }

  return { setPosition }
}

export default {
  setup() {
    return {
      modal
    }
  }
}
</script>

<style lang="less" scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  margin-top: 10px;
  width: calc(var(--base-right-panel-width) - 24px);
  z-index: 9999;
  box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.5);
  .modal-mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: calc(100% - var(--base-right-panel-width));
    background: rgba(33, 33, 33, 0.65);
    z-index: 9999;
  }

  .modal-content {
    position: relative;
    width: 100%;
    z-index: 10000;
    padding: 8px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    border: 1px solid var(--ti-lowcode-tabs-border-color);
    border-radius: 4px;
    background-color: var(--ti-lowcode-toolbar-bg);
    overflow: auto;
    max-height: 100%;
    box-sizing: border-box;
  }
}
</style>
