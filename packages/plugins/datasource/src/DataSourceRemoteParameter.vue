<template>
  <div class="title">请求参数(JSON)</div>
  <monaco-editor :value="modelValue" class="monaco-editor" :options="options" @change="change" />
</template>

<script>
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { theme } from '@opentiny/tiny-engine-controller/adapter'

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
        theme: theme(),
        roundedSelection: true,
        automaticLayout: true,
        autoIndent: true,
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
}
</style>
