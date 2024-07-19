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
export const useModalMask = () => {
  const setPosition = (event) => {
    const target = event.target
    // 获取触发事件元素的高度
    const elementHeight = target.offsetHeight
    // 获取触发事件元素距离顶部的高度
    const elementTop = target.getBoundingClientRect().top + window.scrollY
    // 获取页面总高度
    const pageHeight = document.documentElement.scrollHeight
    const elementBottom = pageHeight - elementTop - elementHeight
    const panelWidth = window.getComputedStyle(document.body).getPropertyValue('--base-right-panel-width')
    const innnerWidth = window.innerWidth
    const modalHalfWidth = (parseInt(panelWidth) - 24) / 2
    const x = event.x
    const y = event.y

    if (elementBottom >= 110) {
      modal.top = y
    } else {
      modal.top = y - 110
    }

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
    background: var(--lowcode-base-mode-mask-background);
    opacity: 0.5;
    z-index: 9999;
  }

  .modal-content {
    position: absolute;
    top: 0;
    left: 16px;
    z-index: 10000;
    padding: 12px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    box-shadow: 0px 0px 20px 0px var(--lowcode-base-mode-mask-shadow);
    border-radius: 6px;
    background-color: var(--lowcode-base-mode-mask-background);
    overflow: auto;
    max-height: 100%;
    box-sizing: border-box;
  }
}
</style>
