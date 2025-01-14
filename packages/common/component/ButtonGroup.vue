<template>
  <div class="button-group">
    <slot></slot>
  </div>
</template>

<style lang="less" scoped>
.button-group {
  display: grid;
  grid-auto-flow: column;
  column-gap: 4px;
  align-items: center;

  :deep(.svg-button),
  :deep(.tiny-button) {
    margin: 0;
  }
  :deep(.tiny-button) {
    padding: 0;
    min-width: 40px;
  }
  :deep(.tiny-button + .svg-button) {
    margin-left: 4px;
  }
  :deep(.tiny-button + .tiny-button) {
    margin-left: 8px;
  }
  :deep(.tiny-button.tiny-button.tiny-button--default) {
    border-color: var(--te-common-border-secondary);
  }
}
</style>
