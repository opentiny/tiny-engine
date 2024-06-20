<template>
  <div id="canvas-wrap" ref="canvasRef">
    <div ref="siteCanvas" class="site-canvas" :style="siteCanvasStyle">
      <slot name="container"></slot>
    </div>
    <slot name="footer"></slot>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useLayout } from '@opentiny/tiny-engine-controller'

const siteCanvasStyle = computed(() => {
  const { scale } = useLayout().getDimension()
  return {
    height: `calc((100% - var(--base-bottom-panel-height, 30px) - 36px) / ${scale})`,
    transform: `scale(${scale})`
  }
})
</script>
