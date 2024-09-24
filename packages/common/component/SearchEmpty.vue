<template>
  <div v-if="isShow" class="empty-wrap">
    <svg-icon class="empty-icon" name="empty"></svg-icon>
    <p class="empty-text">暂无数据</p>
  </div>
</template>
<script>
export default {
  props: {
    /**
     * 控制搜索空数据显示
     */
    isShow: {
      type: Boolean,
      default: false
    }
  }
}
</script>
<style lang="less" scoped>
.empty-wrap {
  text-align: center;
  margin-top: 20px;

  .empty-icon {
    width: 64px;
    height: 64px;
    color: var(--ti-lowcode-empty-icon-color);
  }

  .empty-text {
    margin-top: 6px;
    margin-bottom: 0;
    font-size: 12px;
    color: var(--ti-lowcode-empty-text-color);
  }
}
</style>
