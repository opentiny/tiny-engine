<template>
  <div class="build-loading-renderer" v-if="!hasReasoningFinished">
    <img :src="getIconUrl(statusData.icon)" :alt="resolvedStatus" />
    <div class="build-loading-renderer-content">
      <div class="build-loading-renderer-content-header">{{ statusData.title }}</div>
      <div class="build-loading-renderer-content-body">{{ statusData.content }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'

export const resolveAgentRenderState = (props: any) => {
  const renderContent = props.message?.renderContent
  const contentItem = Array.isArray(renderContent) ? renderContent[props.contentIndex || 0] || {} : {}

  return {
    status: props.status || contentItem.status || 'loading',
    content: props.content || contentItem.content,
    contentType: props.type || props.contentType || contentItem.type || contentItem.contentType
  }
}

export default {
  props: {
    content: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: ''
    },
    contentType: {
      type: String
    },
    type: {
      type: String
    },
    message: {
      type: Object,
      default: () => ({})
    },
    contentIndex: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const getIconUrl = (icon: string) => {
      return new URL(`../../../assets/${icon}`, import.meta.url).href
    }

    const resolvedState = computed(() => resolveAgentRenderState(props))
    const resolvedStatus = computed(() => resolvedState.value.status)
    const resolvedContent = computed(() => resolvedState.value.content)
    const resolvedContentType = computed(() => resolvedState.value.contentType)

    const statusDataMap = {
      reasoning: {
        title: '深度思考中，请稍等片刻',
        icon: 'loading.webp',
        content: () => resolvedContent.value?.slice(-30) || '...'
      },
      loading: {
        title: '页面生成中，请稍等片刻',
        icon: 'loading.webp',
        content: () => resolvedContent.value?.slice(-30) || '...'
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
        content: () => resolvedContent.value?.slice(-30) || '页面生成失败',
        icon: 'failed.svg'
      }
    }

    const hasReasoningFinished = computed(
      () => resolvedContentType.value === 'reasoning' && resolvedStatus.value !== 'reasoning'
    )

    const statusData = computed(() => {
      let status = resolvedStatus.value as keyof typeof statusDataMap
      if (resolvedContentType.value === 'reasoning') {
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
      resolvedStatus,
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
