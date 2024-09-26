<template>
  <ul
    v-if="contextMenu.visible"
    class="context-menu"
    :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
  >
    <li v-if="contextMenu.type" @click="hidePlugin">隐藏 "{{ contextMenu.item.title }}"</li>
    <li v-if="contextMenu.type" class="bottom-li" @click="switchAlign">
      切换到{{ align.includes('right') ? '左侧' : '右侧' }}
    </li>
    <li
      v-for="(item, index) in list"
      :key="index"
      @click.stop="changeShowState(item.id)"
      class="menu-item-wrapper"
      :class="{
        'bottom-li': index === list.length - 1
      }"
    >
      <span class="check-mark">
        <span v-show="getPluginShown(item.id)">√</span>
      </span>
      <span>{{ item.title }}</span>
    </li>
    <li @click="hideSidebar">隐藏活动栏</li>
  </ul>
</template>

<script>
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-controller'
export default {
  props: {
    list: {
      type: Array
    },
    align: {
      type: String,
      default: 'left'
    }
  },
  emits: ['close', 'switchAlign'],
  setup(props, { emit }) {
    const { PLUGIN_POSITION, getPluginShown, changePluginShown, changeMenuShown } = useLayout()
    const contextMenu = reactive({
      type: true,
      visible: false,
      x: 0,
      y: 0,
      item: null,
      index: null,
      list: null
    })

    // 显示菜单
    const contextMenuWidth = props.align.includes('right') ? 130 : 0
    const showContextMenu = (x, y, type, item, index, align) => {
      contextMenu.type = type
      contextMenu.visible = true
      contextMenu.x = x - contextMenuWidth
      contextMenu.y = y
      if (type) {
        contextMenu.item = item
        contextMenu.index = index
        contextMenu.list = align
      }
    }

    // 隐藏菜单
    const hideContextMenu = () => {
      contextMenu.visible = false
    }

    // 隐藏插件
    const hidePlugin = () => {
      emit('close')
      changePluginShown(contextMenu.item.id)
      hideContextMenu()
    }

    // 切换组件位置
    const switchAlign = () => {
      emit('close')
      emit('switchAlign', contextMenu.index, contextMenu.item.id, contextMenu.list, PLUGIN_POSITION.leftTop)
      hideContextMenu()
    }

    // 隐藏活动栏
    const hideSidebar = () => {
      const align = props.align.includes('right') ? 'right' : 'left'
      changeMenuShown(align)
      hideContextMenu()
    }

    // 改变组件显示状态
    const changeShowState = (pluginName) => {
      changePluginShown(pluginName)
    }

    const handleClickOutside = (event) => {
      if (!event.target.closest('.context-menu')) {
        hideContextMenu()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      contextMenu,
      showContextMenu,
      changeShowState,
      getPluginShown,
      hidePlugin,
      switchAlign,
      hideSidebar
    }
  }
}
</script>

<style scoped>
/* 引入B的CSS样式 */
.context-menu {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  list-style: none;
  width: 135px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.context-menu-header {
  padding: 8px 12px;
  font-weight: bold;
  cursor: default;
  background: #f5f5f5;
  border-bottom: 1px solid #ccc;
}
.bottom-li {
  border-bottom: 1px solid #ccc;
}

.context-menu li {
  padding: 8px 12px;
  cursor: pointer;
}

.context-menu li:hover {
  background: #f0f0f0;
}
.menu-item-wrapper {
  display: flex;
  flex-grow: 1;
}

.check-mark {
  width: 20px;
  text-align: left;
}
</style>
