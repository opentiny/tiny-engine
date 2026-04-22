<template>
  <div class="ai-confirm-dialog">
    <div class="ai-confirm-header">
      <div class="header-left">
        <icon-successful class="icon-successful"></icon-successful>
        <span class="header-title">AI操作已完成，您可选择采纳或放弃</span>
      </div>
      <svg-icon name="close" class="close-icon" @click="handleClose"></svg-icon>
    </div>
    <div class="ai-confirm-actions-row">
      <div class="actions-right">
        <svg-icon name="refresh" class="refresh-icon" @click="handleRefresh" title="重新生成"></svg-icon>
        <tiny-button class="actions-btn" @click="handleCancel" round>放弃</tiny-button>
        <tiny-button class="actions-btn" @click="handleConfirm" type="primary" round> 采纳</tiny-button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { TinyButton } from '@opentiny/vue'
import { IconSuccessful } from '@opentiny/vue-icon'

export default {
  components: {
    IconSuccessful: IconSuccessful(),
    TinyButton
  },
  emits: ['confirm', 'cancel', 'close', 'refresh'],

  setup(props, { emit }) {
    const { pageState, getNodeAIStatus } = useCanvas()

    // 预览区域状态
    const showPreview = ref(true)
    const isPreviewExpanded = ref(false)

    // 获取当前节点的待确认数据
    const currentAIConfirmation = computed(() => {
      const currentSchema = pageState.currentSchema
      if (!currentSchema?.id) {
        return null
      }

      const aiStatus = getNodeAIStatus(currentSchema.id)
      return aiStatus?.pendingConfirmation
    })

    const title = computed(() => currentAIConfirmation.value?.title || '确认AI操作')
    const message = computed(() => currentAIConfirmation.value?.message || '请确认是否应用AI生成的修改？')
    const previewData = computed(() => currentAIConfirmation.value?.data)

    const formattedPreview = computed(() => {
      if (!previewData.value) {
        return ''
      }
      try {
        return JSON.stringify(previewData.value, null, 2)
      } catch {
        return String(previewData.value)
      }
    })

    const handleConfirm = () => {
      emit('confirm')
    }

    const handleCancel = () => {
      emit('cancel')
    }

    const handleClose = () => {
      emit('close')
    }

    const handleRefresh = () => {
      emit('refresh')
    }

    const togglePreview = () => {
      isPreviewExpanded.value = !isPreviewExpanded.value
    }

    return {
      title,
      message,
      previewData,
      formattedPreview,
      showPreview,
      isPreviewExpanded,
      handleConfirm,
      handleCancel,
      handleClose,
      handleRefresh,
      togglePreview
    }
  }
}
</script>

<style lang="less" scoped>
.ai-confirm-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
}

/* 第一行：标题行 */
.ai-confirm-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;

  .header-left {
    display: flex;
    align-items: center;
  }

  .icon-successful {
    font-size: 20px;
    fill: #5CB300;
    margin-right: 8px;
  }

  .header-title {
    font-size: 14px;
    font-weight: 500;
    color: #191919;
    margin-right: 16px;
  }

  .close-icon {
    cursor: pointer;
    font-size: 16px;
    color: #000;
  }
}

/* 第二行：操作行 */
.ai-confirm-actions-row {
  display: flex;
  justify-content: right;
  align-items: center;

  .actions-right {
    display: flex;
    gap: 12px;
    align-items: center;
    .refresh-icon {
      cursor: pointer;
      color: #000;
      font-size: 18px;
    }
    .actions-btn {
      min-width: 68px;
      height: 28px;
    }
  }
}
</style>
