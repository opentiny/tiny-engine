<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    :content="!isFullscreen ? '全屏' : '退出全屏'"
    :disabled="true"
  >
    <template #reference>
      <div class="icon">
        <span class="icon-hides" @click="fullscreen">
          <svg-icon :name="iconName"></svg-icon>
        </span>
        <slot name="text"></slot>
      </div>
    </template>
  </tiny-popover>
</template>

<script>
import { ref } from 'vue'
import { Popover } from '@opentiny/vue'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: Object
    },
    options: {
      type: Object
    }
  },
  setup(props) {
    const isFullscreen = ref(false)
    const iconName = ref(props.icon.fullScreen)

    const fullscreen = () => {
      isFullscreen.value = !isFullscreen.value
      iconName.value = isFullscreen.value ? props.icon.cancelFullScreen : props.icon.fullScreen
      document.webkitFullscreenElement
        ? document.webkitExitFullscreen()
        : document.documentElement.webkitRequestFullScreen()
    }

    return {
      fullscreen,
      isFullscreen,
      iconName
    }
  }
}
</script>
