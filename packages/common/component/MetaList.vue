<template>
  <div class="options">
    <div class="top">
      <div class="title">
        <slot name="title"></slot>
      </div>
    </div>
    <div id="options" class="select-options">
      <slot name="items"></slot>
    </div>
    <div class="actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.options {
  width: 100%;
  .top {
    color: var(--ti-lowcode-meta-list-top-color);
    overflow: hidden;
    .title {
      float: left;
      height: 28px;
      line-height: 28px;
    }
  }
}
</style>
