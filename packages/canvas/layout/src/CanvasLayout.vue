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
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const siteCanvasStyle = computed(() => {
  const { scale } = useLayout().getDimension()
  return {
    height: `calc((100% - var(--base-bottom-panel-height, 30px) - 36px) / ${scale})`,
    transform: `scale(${scale})`
  }
})
</script>

<style lang="less" scoped>
#canvas-wrap {
  background: var(--te-common-bg-container);
  flex: 1 1 0;
  border: none;
  display: flex;
  justify-content: center;
  position: relative;

  .site-canvas {
    background: var(--ti-lowcode-breadcrumb-hover-bg);
    position: absolute;
    overflow: hidden;
    margin: 18px 0;
    transform-origin: top;
  }
}
</style>
