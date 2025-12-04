<template>
  <div class="build-loading-renderer" v-if="!hasReasoningFinished">
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
    },
    contentType: {
      type: String
    }
  },
  setup(props) {
    const getIconUrl = (icon: string) => {
      return new URL(`../../../assets/${icon}`, import.meta.url).href
    }

    const statusDataMap = {
      reasoning: {
        title: '深度思考中，请稍等片刻',
        icon: 'loading.webp',
        content: () => props.content?.slice(-30) || '...'
      },
      loading: {
        title: '页面生成中，请稍等片刻',
        icon: 'loading.webp',
        content: () => props.content?.slice(-30) || '...'
      },
      fix: {
        title: '页面优化中，请稍等片刻',
        icon: 'loading.webp',
        content: () => '检测到问题，正在修复...'
      },
      success: {
        title: '已生成新页面效果',
        content: '您可以继续问答更新页面效果',
        icon: 'success.svg'
      },
      failed: {
        title: '页面生成失败',
        content: () => props.content?.slice(-30) || '页面生成失败',
        icon: 'failed.svg'
      }
    }

    const hasReasoningFinished = computed(() => props.contentType === 'reasoning' && props.status !== 'reasoning')

    const statusData = computed(() => {
      let status = props.status as keyof typeof statusDataMap
      if (props.contentType === 'reasoning') {
        status = 'reasoning'
      }
      const data = statusDataMap[status] || statusDataMap.loading
      return {
        ...data,
        content: typeof data.content === 'function' ? data.content() : data.content
      }
    })

    return {
      statusData,
      getIconUrl,
      hasReasoningFinished
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
