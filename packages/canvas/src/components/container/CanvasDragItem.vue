<template>
  <div draggable="true" class="drag-item" @dragstart="dragstart" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script>
import { utils } from '@opentiny/tiny-engine-utils'
import { dragStart } from './container'

const { deepClone } = utils

export default {
  props: {
    data: Object
  },
  emits: ['click'],
  setup(props, { emit }) {
    const dragstart = (e) => {
      if (props.data) {
        const data = deepClone(props.data)
        dragStart(data)

        // 设置拖拽鼠标样式和设置拖拽预览图
        const target = e.target.querySelector('.component-item-component')
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setDragImage(target, 10, 10)
      }
    }

    const handleClick = () => {
      if (props.data) {
        const data = deepClone(props.data)

        emit('click', data)
      }
    }

    return {
      dragstart,
      handleClick
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
