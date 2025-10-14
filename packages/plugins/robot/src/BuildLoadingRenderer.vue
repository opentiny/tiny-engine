<template>
  <div class="build-loading-renderer">
    <img :src="getIconUrl(statusData.icon)" :alt="status" />
    <div class="build-loading-renderer-content">
      <div class="build-loading-renderer-content-header">{{ statusData.title }}</div>
      <div class="build-loading-renderer-content-body">{{ statusData.content }}</div>
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
    },
    status: {
      type: String,
      default: 'loading'
    }
  },
  setup(props) {
    const getIconUrl = (icon: string) => {
      return new URL(`../assets/${icon}`, import.meta.url).href
    }

    const statusDataMap = {
      loading: {
        title: '页面生成中，请稍等片刻',
        icon: 'loading.webp',
        content: () => props.content?.slice(-30)
      },
      success: {
        title: '已生成新页面效果',
        content: '您可以继续问答更新页面效果',
        icon: 'success.svg'
      },
      failed: {
        title: '页面生成失败',
        content: '页面生成失败',
        icon: 'failed.svg'
      }
    }

    const statusData = computed(() => {
      const data = statusDataMap[props.status as keyof typeof statusDataMap] || statusDataMap.loading
      return {
        ...data,
        content: typeof data.content === 'function' ? data.content() : data.content
      }
    })

    return {
      statusData,
      getIconUrl
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
