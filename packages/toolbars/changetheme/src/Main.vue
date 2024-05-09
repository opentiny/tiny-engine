<template>
  <div class="toolbar-itm-clean">
    <tiny-dropdown :show-icon="false" trigger="click" @item-click="changeTheme">
      <tiny-popover
        trigger="hover"
        :open-delay="1000"
        popper-class="toolbar-right-popover"
        append-to-body
        content="主题切换"
      >
        <template #reference>
          <span class="icon" @click="changeTheme">
            <svg-icon :name="icon"></svg-icon>
          </span>
        </template>
      </tiny-popover>
      <template #dropdown>
        <tiny-dropdown-menu :options="themeOptions"> </tiny-dropdown-menu>
      </template>
    </tiny-dropdown>
  </div>
</template>

<script lang="jsx">
import { reactive } from 'vue'
import { getGlobalConfig, updateGlobalSingleConfig } from '@opentiny/tiny-engine-controller'
import { Popover, Dropdown, DropdownMenu } from '@opentiny/vue'
export default {
  components: {
    TinyPopover: Popover,
    TinyDropdown: Dropdown,
    TinyDropdownMenu: DropdownMenu
  },
  props: {
    icon: {
      type: String,
      default: 'changetheme'
    }
  },
  setup() {
    const storedTheme = localStorage.getItem('tiny-engine-theme') || getGlobalConfig().theme
    const themeOptions = reactive([
      { label: '亮色主题', value: 'light' },
      { label: '暗夜主题', value: 'dark' }
    ])
    if (storedTheme) {
      document.documentElement.setAttribute('data-theme', storedTheme)
    }

    const changeTheme = (data) => {
      const currentTheme = data?.itemData?.value
      if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme)
        localStorage.setItem('tiny-engine-theme', currentTheme)
        updateGlobalSingleConfig('theme', currentTheme)
      }
    }
    return {
      changeTheme,
      themeOptions
    }
  }
}
</script>
