<template>
  <teleport :to="teleport">
    <div class="modal-wrapper">
      <div :class="[isAlignBody ? '' : 'modal-mask']" @click="$emit('close')"></div>

      <div :style="{ top: topStyle + 'px' }" :class="['modal-content', { 'align-body': isAlignBody }]">
        <slot></slot>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'

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
  props: {
    teleport: {
      type: String,
      default: '.tiny-engine-right-wrap'
    }
  },
  setup(props) {
    const isAlignBody = ref(props.teleport === 'body')
    const topStyle = ref(0)

    onMounted(() => {
      if (isAlignBody.value) {
        const modalContentEle = document.querySelector('.modal-content')
        topStyle.value = modal.top < modalContentEle.offsetHeight ? 40 : modal.top - modalContentEle.offsetHeight + 40
      } else {
        topStyle.value = modal.top - 34
      }
    })

    return {
      modal,
      topStyle,
      isAlignBody
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
    z-index: 999;
  }

  .modal-content {
    position: absolute;
    top: 0;
    left: 16px;
    z-index: 1000;
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

  .align-body {
    right: 280px;
    left: calc(100% - 287px - 280px);
  }
}
</style>
