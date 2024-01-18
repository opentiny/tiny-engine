<template>
  <canvas-resize>
    <x6-canvas />
  </canvas-resize>
</template>

<script setup>
import CanvasResize from './CanvasResize.vue'
import X6Canvas from './X6Canvas.vue'
</script>
<style lang="less" scoped>
.insert-panel {
  z-index: 4;
  position: fixed;
  top: 200px;
  left: 400px;
  width: 480px;
  :deep(.components-wrap) {
    & > .tiny-collapse {
      max-height: 300px;
    }
  }
  :deep(#pane-blocks) {
    max-height: 400px;
  }
}
.datainit-tip {
  display: flex;
  height: 100%;
  justify-content: center;
  align-items: center;
  color: #1890ff;
}
</style>
