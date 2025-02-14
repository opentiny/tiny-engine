<template>
  <div class="options">
    <div class="top">
      <div class="title">
        <slot name="title"></slot>
      </div>
      <div class="actions">
        <slot name="actions"></slot>
      </div>
    </div>
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
  .top {
    color: var(--te-component-common-text-color-secondary);
    overflow: hidden;
    .title {
      float: left;
      height: 28px;
      line-height: 28px;
    }
    .actions {
      float: right;
      border: 1px solid var(--te-component-common-border-color);
      overflow: hidden;
      border-radius: 4px 4px 0 0;
    }
  }

  .bottom {
    display: flex;
    padding: 2px;
    margin-top: 4px;
  }
}
</style>
