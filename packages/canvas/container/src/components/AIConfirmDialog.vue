<template>
  <div class="ai-confirm-dialog">
    <div class="ai-confirm-header">
      <div class="header-left">
        <icon-successful class="icon-successful"></icon-successful>
        <span class="header-title">AI操作已完成，您可选择采纳或放弃</span>
      </div>
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
import { TinyButton } from '@opentiny/vue'
import { IconSuccessful } from '@opentiny/vue-icon'

export default {
  components: {
    IconSuccessful: IconSuccessful(),
    TinyButton
  },
  emits: ['confirm', 'cancel', 'close', 'refresh'],

  setup(props, { emit }) {
    const handleConfirm = () => {
      emit('confirm')
    }

    const handleCancel = () => {
      emit('cancel')
    }

    const handleRefresh = () => {
      emit('refresh')
    }

    return {
      handleConfirm,
      handleCancel,
      handleRefresh
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
    fill: #5cb300;
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
