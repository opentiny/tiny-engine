<template>
  <div class="canvas-container">
    <div class="container-box">
      <div class="container-tip">
        <slot>{{ placeholder }}</slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    placeholder: {
      type: String,
      default: '请将元素拖放到这里'
    }
  }
}
</script>

<style lang="less" scoped>
.canvas-container {
  min-height: 48px;
}
</style>
