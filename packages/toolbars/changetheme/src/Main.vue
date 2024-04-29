<template>
  <div class="toolbar-itm-clean">
    <tiny-popover
      trigger="hover"
      :open-delay="1000"
      popper-class="toolbar-right-popover"
      append-to-body
      content="区块设置"
    >
      <template #reference>
        <span class="icon" @click="changeTheme">
          <svg-icon :name="icon"></svg-icon>
        </span>
      </template>
    </tiny-popover>
  </div>
</template>

<script lang="jsx">
import { getGlobalConfig } from '@opentiny/tiny-engine-controller'
import { Popover } from '@opentiny/vue'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: String,
      default: 'setting'
    }
  },
  setup() {
    const theme = getGlobalConfig().theme
    document.documentElement.setAttribute('data-theme', theme)

    const changeTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      let targetTheme = 'light'
      if (currentTheme === 'light') {
        targetTheme = 'dark'
      }
      document.documentElement.setAttribute('data-theme', targetTheme)
    }
    return {
      changeTheme
    }
  }
}
</script>
