<template>
  <div class="button-group">
    <slot></slot>
  </div>
</template>

<style lang="less" scoped>
.button-group {
  display: grid;
  grid-auto-flow: column;
  column-gap: 8px;
  align-items: center;

  :deep(.svg-button),
  :deep(.tiny-button) {
    margin: 0;
  }
}
</style>
