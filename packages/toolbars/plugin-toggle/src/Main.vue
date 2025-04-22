<template>
  <div class="toolbar-plugin-toggle" @click="toggleMenu" ref="toggleRef">
    <ToolbarBase content="插件显示隐藏" :icon="options.icon.default || options.icon" :options="options" />

    <!-- 二级菜单 - 选择左右侧 -->
    <div v-if="isMenuVisible" class="plugin-menu" :style="menuPosition" @click.stop>
      <div class="menu-item" @mouseenter="showLeftPlugins" @click.stop>
        <span>左侧面板</span>
        <span class="arrow-left"><TinyIconChevronLeft /></span>

        <!-- 三级菜单 - 左侧插件列表 -->
        <div v-if="showLeftMenu" class="submenu" :style="submenuStyle" @click.stop>
          <div
            v-for="plugin in leftPlugins"
            :key="plugin.id"
            class="submenu-item"
            @click.stop="togglePlugin(plugin.id)"
          >
            <span class="check-mark">
              <span v-if="isPluginShown(plugin.id)"><TinyIconYes /></span>
              <span v-else></span>
            </span>
            <span>{{ plugin.title }}</span>
          </div>
        </div>
      </div>

      <div class="menu-item" @mouseenter="showRightPlugins" @click.stop>
        <span>右侧面板</span>
        <span class="arrow-left"><TinyIconChevronLeft /></span>

        <!-- 三级菜单 - 右侧插件列表 -->
        <div v-if="showRightMenu" class="submenu" :style="submenuStyle" @click.stop>
          <div
            v-for="plugin in rightPlugins"
            :key="plugin.id"
            class="submenu-item"
            @click.stop="togglePlugin(plugin.id)"
          >
            <span class="check-mark">
              <span v-if="isPluginShown(plugin.id)"><TinyIconYes /></span>
              <span v-else></span>
            </span>
            <span>{{ plugin.title }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { IconChevronLeft, IconYes } from '@opentiny/vue-icon'
import { usePluginToggle } from './composable'

defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

const TinyIconChevronLeft = IconChevronLeft()
const TinyIconYes = IconYes()

const {
  isPluginShown,
  isMenuVisible,
  showLeftMenu,
  showRightMenu,
  toggleRef,
  menuPosition,
  leftPlugins,
  rightPlugins,
  submenuStyle,
  toggleMenu,
  showLeftPlugins,
  showRightPlugins,
  togglePlugin
} = usePluginToggle()
</script>

<style lang="less" scoped>
.toolbar-plugin-toggle {
  position: relative;
  display: inline-block;
}

.plugin-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 92px;
  user-select: none;
}

.menu-item {
  padding: 8px 12px;
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  position: relative;
  white-space: nowrap;

  &:hover {
    background-color: #f5f5f5;
  }

  > span:not(.arrow-left) {
    flex: 1;
    text-align: center;
    padding: 0 4px;
  }
}

.arrow-left {
  display: flex;
  min-width: 1em;
  font-size: 150%;
  justify-content: flex-start;
  align-items: center;
  color: #666;
}

.submenu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 105px;
  margin-right: 4px;
  user-select: none;
  max-height: 80vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
  }
}

.submenu-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: #f5f5f5;
  }
}

.check-mark {
  width: 20px;
  font-size: 18px;
  display: inline-block;
  margin-right: 4px;
  text-align: center;
}
</style>
