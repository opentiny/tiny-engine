<template>
  <div class="toolbar-plugin-toggle" @click="showMenu" ref="toggleRef">
    <ToolbarBase content="插件显示隐藏" :icon="options.icon.default || options.icon" :options="options" />

    <!-- 二级菜单 - 选择左右侧 -->
    <div v-if="isMenuVisible" class="plugin-menu" :style="menuPosition">
      <div class="menu-item" @mouseenter="showLeftPlugins">
        <span>左侧插件栏</span>
        <span class="arrow-left"> ‹ </span>

        <!-- 三级菜单 - 左侧插件列表 -->
        <div v-if="showLeftMenu" class="submenu" :style="submenuStyle">
          <div
            v-for="plugin in leftPlugins"
            :key="plugin.id"
            class="submenu-item"
            @click.stop="togglePlugin(plugin.id)"
          >
            <span class="check-mark">{{ isPluginShown(plugin.id) ? '√' : '' }}</span>
            <span>{{ plugin.title }}</span>
          </div>
        </div>
      </div>

      <div class="menu-item" @mouseenter="showRightPlugins">
        <span>右侧插件栏</span>
        <span class="arrow-left"> ‹ </span>

        <!-- 三级菜单 - 右侧插件列表 -->
        <div v-if="showRightMenu" class="submenu" :style="submenuStyle">
          <div
            v-for="plugin in rightPlugins"
            :key="plugin.id"
            class="submenu-item"
            @click.stop="togglePlugin(plugin.id)"
          >
            <span class="check-mark">{{ isPluginShown(plugin.id) ? '√' : '' }}</span>
            <span>{{ plugin.title }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

const { getPluginShown: isPluginShown, changePluginShown } = useLayout()

const isMenuVisible = ref(false)
const showLeftMenu = ref(false)
const showRightMenu = ref(false)
const toggleRef = ref<HTMLElement | null>(null)
const menuPosition = ref<{
  position?: 'fixed'
  top?: string
  right?: string
  transform?: string
}>({})
const activeMenuItemRect = ref<DOMRect | null>(null)

interface Plugin {
  id: string
  title: string
  align?: string
}

interface PluginData {
  [key: string]: {
    title: string
    align: string
    [key: string]: any
  }
}

const leftPlugins = ref<Plugin[]>([])
const rightPlugins = ref<Plugin[]>([])

// 初始化插件数据
const initPlugins = () => {
  try {
    const pluginData = localStorage.getItem('plugin')
    if (!pluginData) return

    const plugins = JSON.parse(pluginData) as PluginData

    Object.entries(plugins).forEach(([key, value]) => {
      const plugin: Plugin = {
        id: key,
        title: value.title
      }

      if (value.align?.includes('left')) {
        leftPlugins.value.push(plugin)
      } else if (value.align?.includes('right')) {
        rightPlugins.value.push(plugin)
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize plugins:', error)
  }
}

// 计算菜单位置的常量
const MENU_OFFSET = 17
const SUBMENU_OFFSET = 258

const showMenu = (event: MouseEvent) => {
  if (!toggleRef.value) return

  const rect = toggleRef.value.getBoundingClientRect()
  menuPosition.value = {
    position: 'fixed',
    top: `${rect.top}px`,
    right: `${window.innerWidth - rect.left + MENU_OFFSET}px`,
    transform: 'translateX(0)'
  }
  isMenuVisible.value = true
  event.stopPropagation()
}

const showLeftPlugins = (event: MouseEvent) => {
  const menuItem = event.currentTarget as HTMLElement
  activeMenuItemRect.value = menuItem.getBoundingClientRect()
  showLeftMenu.value = true
  showRightMenu.value = false
}

const showRightPlugins = (event: MouseEvent) => {
  const menuItem = event.currentTarget as HTMLElement
  activeMenuItemRect.value = menuItem.getBoundingClientRect()
  showRightMenu.value = true
  showLeftMenu.value = false
}

const togglePlugin = (pluginId: string) => {
  changePluginShown(pluginId)
}

const handleClickOutside = (event: MouseEvent) => {
  if (toggleRef.value && !toggleRef.value.contains(event.target as Node)) {
    isMenuVisible.value = false
    showLeftMenu.value = false
    showRightMenu.value = false
  }
}

const submenuStyle = computed(() => {
  if (!activeMenuItemRect.value) return {}

  return {
    position: 'fixed' as const,
    top: 0,
    right: `${window.innerWidth - activeMenuItemRect.value.left - SUBMENU_OFFSET}px`
  }
})

// 初始化插件数据
initPlugins()

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
  min-width: 108px;
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
  display: inline-block;
  margin-right: 4px;
  text-align: center;
  color: #2d8cf0;
}
</style>
