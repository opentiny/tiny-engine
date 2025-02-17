<template>
  <monaco-editor :value="modelValue" class="monaco-editor" :options="options" @change="change" />
</template>

<script>
import { VueMonaco } from '@opentiny/tiny-engine-common'

export default {
  components: {
    MonacoEditor: VueMonaco
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },
  setup(props, { emit }) {
    const change = (value) => {
      if (typeof value !== 'string') {
        return
      }

      emit('update:modelValue', value)
    }

    return {
      options: {
        language: 'json',
        minimap: { enabled: false }
      },
      change
    }
  }
}
</script>

<style lang="less" scoped>
.title {
  font-size: 14px;
}

.monaco-editor {
  height: 180px;
  margin-top: 8px;
  border: 1px solid var(--te-datasource-common-border-color-divider);
  border-radius: 4px;
}
</style>
