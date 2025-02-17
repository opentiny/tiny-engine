<template>
  <div id="canvas-wrap" ref="canvasRef">
    <slot name="header"></slot>
    <div ref="siteCanvas" class="site-canvas" :style="siteCanvasStyle">
      <slot name="container"></slot>
    </div>
    <slot name="footer"></slot>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useCanvas, useLayout } from '@opentiny/tiny-engine-meta-register'

const ROUTE_BAR_HEIGHT = 32

const { isBlock } = useCanvas()
const dimension = useLayout().getDimension()

const siteCanvasStyle = computed(() => {
  const { scale } = dimension
  const routeBarHeight = isBlock() ? 0 : ROUTE_BAR_HEIGHT
  return {
    height: `calc((100% - var(--base-bottom-panel-height, 30px) - ${36 + routeBarHeight}px) / ${scale})`,
    transform: `scale(${scale})`,
    marginTop: `${18 + routeBarHeight}px`
  }
})
</script>

<style lang="less" scoped>
#canvas-wrap {
  background: var(--te-canvas-layout-bg-color);
  flex: 1 1 0;
  border: none;
  display: flex;
  justify-content: center;
  position: relative;

  .site-canvas {
    background: var(--te-canvas-layout-content-bg-color);
    position: absolute;
    overflow: hidden;
    margin-bottom: 18px;
    transform-origin: top;
  }
}
</style>
