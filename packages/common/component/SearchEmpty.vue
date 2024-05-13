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
