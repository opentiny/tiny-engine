<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    :content="!isFullscreen ? '全屏' : '退出全屏'"
  >
    <template #reference>
      <span class="icon" @click="fullscreen">
        <svg-icon :name="iconName"></svg-icon>
      </span>
    </template>
  </tiny-popover>
</template>

<script>
import { ref } from 'vue'
import { Popover } from '@opentiny/vue'
import { PublicIcon } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyPopover: Popover,
    PublicIcon
  },
  props: {
    icon: {
      type: String,
      default: 'full-screen'
    }
  },
  setup(props, { emit }) {
    const isFullscreen = ref(false)
    const iconName = ref(props.icon)

    const fullscreen = () => {
      isFullscreen.value = !isFullscreen.value
      iconName.value = isFullscreen.value ? 'cancel-full-screen' : 'full-screen'
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
