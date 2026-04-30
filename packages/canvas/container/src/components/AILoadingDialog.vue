<template>
  <div class="ai-loading-dialog">
    <div class="ai-loading-header">
      <div class="header-left">
        <img src="../../assets/loading.webp" class="loading" />
        <span class="header-title">AI操作中，您可随时取消</span>
      </div>
    </div>
    <div class="ai-loading-actions-row">
      <div class="actions-right">
        <tiny-button class="actions-btn" @click="handleCancel" round>取消</tiny-button>
      </div>
    </div>
  </div>
</template>
<script>
import { TinyButton } from '@opentiny/vue'

export default {
  components: {
    TinyButton
  },
  emits: ['cancel'],

  setup(props, { emit }) {
    const handleCancel = () => {
      emit('cancel')
    }

    return {
      handleCancel
    }
  }
}
</script>

<style lang="less" scoped>
.ai-loading-dialog {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
}

.ai-loading-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .header-left {
    display: flex;
    align-items: center;
  }

  .loading {
    width: 20px;
    height: 20px;
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

.ai-loading-actions-row {
  display: flex;
  justify-content: right;
  align-items: center;

  .actions-right {
    display: flex;
    gap: 12px;
    align-items: center;
    .actions-btn {
      min-width: 40px;
      height: 28px;
    }
  }
}
</style>
