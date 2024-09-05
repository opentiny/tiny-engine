<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    :content="content"
  >
    <template #reference>
      <span class="icon">
        <span :class="[options?.useDefaultClass ? 'icon-hides' : '']">
          <svg-icon :name="icon"></svg-icon>
          <span v-if="!isSaved() && options?.showDots" class="dots"></span>
        </span>
      </span>
    </template>
  </tiny-popover>
</template>
<script>
import { Popover } from '@opentiny/vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    options: {
      type: Object,
      default: () => {}
    }
  },
  setup() {
    const { isSaved } = useCanvas();
    return {
      isSaved
    }
  }
}
</script>

<style lang="less" scoped>
.dots {
  width: 6px;
  height: 6px;
  background: var(--ti-lowcode-toolbar-dot-color);
  border-radius: 50%;
  display: inline-block;
  position: absolute;
  top: 4px;
  right: 3px;
  z-index: 100;
}
</style>
