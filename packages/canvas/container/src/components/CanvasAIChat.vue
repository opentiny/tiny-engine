<template>
  <div class="chat-input">
    <TrSender
      v-model="content"
      mode="multiple"
      placeholder="请输入问题或“/”获取提示词"
      clearable
      show-word-limit
      :max-length="5000"
      @submit="handleSubmit"
    >
      <template #prefix>
        <svg-icon name="AI"></svg-icon>
      </template>
    </TrSender>
  </div>
</template>

<script>
import { ref } from 'vue'
import { TrSender } from '@opentiny/tiny-robot'

export default {
  components: {
    TrSender
  },

  emits: ['complete', 'close'],

  setup(props, { emit }) {
    const content = ref('')

    const handleSubmit = async (value) => {
      emit('complete', value)

      content.value = ''
    }

    return {
      content,
      handleSubmit
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.tr-sender) {
  .tr-sender-main {
    padding: 10px 16px 6px !important;
  }

  .tr-sender-prefix .icon-AI.svg-icon {
    width: 24px !important;
    height: 24px !important;
  }

  .tr-sender-word-counter,
  .tr-sender-editor-content .ProseMirror {
    font-size: 14px !important;
  }

  .tr-action-button svg,
  .tr-sender-submit-button__icon {
    font-size: 24px !important;
  }
}
</style>
