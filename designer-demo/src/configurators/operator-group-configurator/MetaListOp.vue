<template>
  <div class="options">
    <div id="options" class="select-options">
      <slot name="items"></slot>
    </div>
    <div class="bottom">
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.options {
  width: 100%;
  .bottom {
    display: flex;
    padding: 2px;
    margin-top: 4px;
  }
}
</style>
