<template>
  <toolbar-base
    :content="!isFullscreen ? '切换全屏' : '退出全屏'"
    :icon="iconName"
    :options="options"
    @click-api="fullscreen"
  >
  </toolbar-base>
</template>

<script>
import { ref } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const isFullscreen = ref(false)
    const iconName = ref(props.options.icon.fullScreen)

    const fullscreen = () => {
      isFullscreen.value = !isFullscreen.value
      iconName.value = isFullscreen.value ? props.options.icon.cancelFullScreen : props.options.icon.fullScreen
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
