<template>
  <div class="top-panel-logout">
    <a href="/platform-center/api/logout">注销</a>
  </div>
</template>

<script>
export default {
  setup() {
    return {}
  }
}
</script>

<style lang="less" scoped>
.top-panel-logout {
  padding-right: 12px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  span,
  a {
    color: var(--te-toolbars-logout-text-color);
  }
}
</style>
