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
import { useLayout } from '@opentiny/tiny-engine-meta-register'

const siteCanvasStyle = computed(() => {
  const { scale } = useLayout().getDimension()
  return {
    height: `calc((100% - var(--base-bottom-panel-height, 30px) - 68px) / ${scale})`,
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
    // TODO 这里的多的32px是route bar的高度，硬编码设置margin-top不适合动态显隐route bar。是否能改成不用 position: absolute;
    margin-top: calc(18px + 32px);
    margin-bottom: 18px;
    transform-origin: top;
  }
}
</style>
