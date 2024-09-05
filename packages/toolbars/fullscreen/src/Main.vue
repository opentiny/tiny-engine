<template>
  <toolbar-base-component
    :type="type"
    :content="!isFullscreen ? '全屏' : '退出全屏'"
    :icon="iconName"
    :options="options"
    @click-api="fullscreen"
  >
  </toolbar-base-component>
</template>

<script>
import { ref } from 'vue'
import { Popover } from '@opentiny/vue'
import { ToolbarBaseComponent } from '@opentiny/tiny-engine-layout'

export default {
  components: {
    TinyPopover: Popover,
    ToolbarBaseComponent
  },
  props: {
    type: {
      type: String,
      default: ''
    },
    icon: {
      type: Object
    },
    options: {
      type: Object,
      default: () => {}
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
