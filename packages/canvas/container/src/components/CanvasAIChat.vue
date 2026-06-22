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
:deep(.tiny-sender) {
  .tiny-sender__input-row {
    min-height: 64px;
  }
  .tiny-sender__prefix-slot .svg-icon {
    width: 24px;
    height: 24px;
  }
  .tiny-sender__word-limit,
  .tiny-sender__input-field-wrapper .tiny-textarea__inner {
    font-size: 14px !important;
  }
  .action-buttons__icon--send,
  .action-buttons__button svg {
    font-size: 24px !important;
  }
  .action-buttons {
    gap: 6px;
  }
  .action-buttons__utility {
    gap: 0;
  }
}
</style>
