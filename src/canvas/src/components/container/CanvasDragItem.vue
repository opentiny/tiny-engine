<template>
  <div draggable="true" class="drag-item" @dragstart="dragstart">
    <slot></slot>
  </div>
</template>

<script>
import { dragStart } from './container'
export default {
  props: {
    data: Object
  },
  emits: ['click'],
  setup(props, { emit }) {
    const dragstart = (e) => {
      if (props.data && e.button === 0) {
        const data = JSON.parse(JSON.stringify(props.data))
        emit('click', data)
        dragStart(data)

        // 设置拖拽鼠标样式和设置拖拽预览图
        const target = e.target.querySelector('.component-item-component')
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setDragImage(target, 10, 10)
      }
    }
    return {
      dragstart
    }
  }
}
</script>
<style lang="less">
.drag-item {
  user-select: none;
  cursor: move;
}
</style>
