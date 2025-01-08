<template>
  <div v-if="name" class="data-handle">
    <div>{{ name }}<slot name="title"></slot></div>
  </div>
  <monaco-editor ref="editor" :value="modelValue" class="monaco-editor" :options="options" @change="change" />
</template>

<script>
import { ref } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'

export default {
  components: {
    MonacoEditor: VueMonaco
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const change = (value) => {
      if (typeof value !== 'string') {
        return
      }

      emit('update:modelValue', value)
    }
    const editor = ref(null)
    const getEditorValue = () => editor.value?.getEditor()?.getValue()

    return {
      editor,
      options: {
        language: 'javascript',
        mouseStyle: 'default',
        minimap: { enabled: false }
      },
      getEditorValue,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.data-handle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  font-size: var(--te-base-font-size-base);

  div {
    color: var(--te-common-text-primary);
  }

  .icon-del {
    cursor: pointer;
    color: var(--ti-lowcode-datasource-toolbar-icon-color);
  }
}

.monaco-editor {
  min-height: 120px;
  height: 100%;
  border: 1px solid var(--te-common-border-divider);
  border-radius: 4px;
}
</style>
