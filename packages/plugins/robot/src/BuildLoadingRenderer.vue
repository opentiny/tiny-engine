<template>
  <div class="build-loading-renderer">
    <img src="../assets/loading.webp" alt="loading" />
    <div class="build-loading-renderer-content">
      <div class="build-loading-renderer-content-header">页面生成中，请稍等片刻</div>
      <div class="build-loading-renderer-content-body">{{ renderContent }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'

export default {
  props: {
    content: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const renderContent = computed(() => {
      return props.content.slice(-30)
    })

    return {
      renderContent
    }
  }
}
</script>

<style lang="less">
.build-loading-renderer {
  display: flex;
  img {
    width: 20px;
    height: 20px;
  }
  &-content {
    margin-left: 16px;
    &-header {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    &-body {
      color: var(--te-chat-model-helper-text);
      font-size: 12px;
      width: 160px;
      height: 30px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
