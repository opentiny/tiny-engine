<template>
  <div id="canvas-wrap" ref="canvasRef">
    <div ref="siteCanvas" class="site-canvas">
      <canvas-container></canvas-container>
    </div>
    <footer-bar :data="footData" @click="selectFooterNode"></footer-bar>
  </div>
</template>

<script setup>
import { CanvasContainer } from '@opentiny/tiny-engine-canvas';
</script>

<style lang="less" scoped>
#canvas-wrap {
  background: var(--ti-lowcode-canvas-wrap-bg);
  flex: 1 1 0;
  border: none;
  display: flex;
  justify-content: center;
  position: relative;

  .site-canvas {
    width: 100%;
    height: 100%;
    // height: calc(100% - var(--base-bottom-panel-height, 30px) - 36px);
    background: var(--ti-lowcode-breadcrumb-hover-bg);
    position: absolute;
    // margin: 18px 0;
  }
}
</style>
