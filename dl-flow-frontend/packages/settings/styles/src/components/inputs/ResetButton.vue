<template>
  <TinyButton class="reset-btn" @click="reset">{{ text }}</TinyButton>
</template>

<script>
import { Button } from '@opentiny/vue'

export default {
  components: {
    TinyButton: Button
  },
  props: {
    text: {
      type: String,
      default: 'Reset'
    }
  },
  emits: ['reset'],
  setup(props, { emit }) {
    const reset = () => {
      emit('reset')
    }

    return {
      reset
    }
  }
}
</script>

<style lang="less" scoped>
.reset-btn.tiny-button {
  display: block;
  width: 100%;
  max-width: 100%;
  border: 0;
  border: 1px solid var(--ti-lowcode-toolbar-border-color);
}
</style>
