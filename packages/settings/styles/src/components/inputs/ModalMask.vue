<template>
  <teleport to=".tiny-engine-right-wrap">
    <div class="modal-wrapper">
      <div class="modal-mask" @click="$emit('close')"></div>

      <div :style="{ top: modal.top - 30 + 'px' }" class="modal-content">
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
  .modal-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 9999;
  }

  .modal-content {
    position: absolute;
    top: 0;
    left: 16px;
    z-index: 10000;
    padding: 8px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    border: 1px solid var(--ti-lowcode-tabs-border-color);
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    background-color: var(--ti-lowcode-toolbar-bg);
    overflow: auto;
    max-height: 100%;
    box-sizing: border-box;
  }
}
</style>
