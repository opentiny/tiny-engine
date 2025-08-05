<template>
  <div draggable="true" class="drag-item" @dragstart="dragstart" @dragend="dragend" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { getMetaApi } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { deepClone } = utils

export default {
  props: {
    data: Object
  },
  emits: ['click'],
  setup(props, { emit }) {
    const canvasApi = getMetaApi('engine.canvas').canvasApi

    const dragstart = (e: any) => {
      if (props.data && canvasApi.value?.dragStart) {
        const data = deepClone(props.data)
        canvasApi.value.dragStart(data)

        // 设置拖拽鼠标样式和设置拖拽预览图
        const target = e.target.querySelector('.component-item-component')
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setDragImage(target, 10, 10)
      }
    }

    const dragend = (e) => {
      // 拖拽结束，但是此时的 dropEffect 为 none ，说明此时没有完成拖拽，需要清理一下拖拽状态
      if (e.dataTransfer?.dropEffect === 'none') {
        canvasApi.value?.dragEnd?.()
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
      dragend,
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
