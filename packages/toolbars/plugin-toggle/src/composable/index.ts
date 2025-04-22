import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

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

export const usePluginToggle = () => {
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

  const leftPlugins = ref<Plugin[]>([])
  const rightPlugins = ref<Plugin[]>([])

  // 菜单位置的常量
  const MENU_OFFSET = 17
  const SUBMENU_OFFSET = 258

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

  // 显示菜单
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

  // 切换菜单的显示状态
  const toggleMenu = (event: MouseEvent) => {
    if (!toggleRef.value) return

    if (isMenuVisible.value) {
      // 如果菜单已经显示，则隐藏所有菜单
      isMenuVisible.value = false
      showLeftMenu.value = false
      showRightMenu.value = false
    } else {
      // 如果菜单未显示，则显示菜单
      const rect = toggleRef.value.getBoundingClientRect()
      menuPosition.value = {
        position: 'fixed',
        top: `${rect.top}px`,
        right: `${window.innerWidth - rect.left + MENU_OFFSET}px`,
        transform: 'translateX(0)'
      }
      isMenuVisible.value = true
    }
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
    // 检查点击目标是否在菜单区域内
    const isClickInMenu =
      (event.target as Element)?.closest('.plugin-menu') || (event.target as Element)?.closest('.submenu')

    // 如果点击的不是菜单区域，并且不是切换按钮本身，则隐藏菜单
    if (!isClickInMenu && (!toggleRef.value || !toggleRef.value.contains(event.target as Node))) {
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

  return {
    isPluginShown,
    isMenuVisible,
    showLeftMenu,
    showRightMenu,
    toggleRef,
    menuPosition,
    leftPlugins,
    rightPlugins,
    submenuStyle,
    showMenu,
    toggleMenu,
    showLeftPlugins,
    showRightPlugins,
    togglePlugin
  }
}
