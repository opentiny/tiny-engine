<template>
  <div class="response-data">
    <span class="copy-data" title="复制" @click="copyData"><icon-copy></icon-copy></span>
    <div class="resonse-header">
      <tiny-alert
        type="info"
        description="仅用于方便地设置数据源字段，从接口的响应数据列表中，选一条对象结构的数据，粘贴至下方的编辑器中，点击右上角“保存”，将会读取该对象的字段，并引导设置是否启用字段。"
        :closable="false"
        class="life-cycle-alert"
      ></tiny-alert>
    </div>
    <div id="remote-data-editor" class="data-editor">
      <monaco-editor
        ref="editor"
        :value="state.value"
        class="monaco-editor"
        :options="state.options"
        @change="handleChange"
      />
    </div>
  </div>
</template>

<script>
import { reactive, watchEffect, ref } from 'vue'
import { VueMonaco as MonacoEditor } from '@opentiny/tiny-engine-common'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { iconCopy } from '@opentiny/vue-icon'
import { Alert } from '@opentiny/vue'
import useClipboard from 'vue-clipboard3'

const editor = ref(null)

export const getResponseData = () => editor.value.getEditor().getValue()

export default {
  components: {
    MonacoEditor,
    TinyAlert: Alert,
    iconCopy: iconCopy()
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      value: '',
      options: {
        theme: theme(),
        roundedSelection: true,
        automaticLayout: true,
        autoIndent: true,
        language: 'json',
        minimap: { enabled: false }
      }
    })

    const { toClipboard } = useClipboard()

    watchEffect(() => {
      state.value = JSON.stringify(props.modelValue, null, 2)
    })

    const copyData = async () => {
      try {
        await toClipboard(state.value)
      } catch (e) {
        // do nothing
      }

      emit('copy', state.value)
    }

    const handleChange = (val) => {
      state.value = val
    }

    return {
      state,
      copyData,
      editor,
      handleChange
    }
  }
}
</script>

<style lang="less" scoped>
.response-data {
  position: relative;
  .resonse-header {
    padding: 10px;

    .title {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      display: inline-block;
      border-bottom: 1px solid var(--ti-lowcode-datasource-tabs-border-color);
      width: 100%;
      padding-bottom: 8px;
    }
  }

  .copy-data {
    position: absolute;
    right: 20px;
    top: 80px;
    z-index: 9999;

    svg {
      width: 23px;
      height: 23px;
      padding: 5px;
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      cursor: pointer;

      &:hover {
        background: var(--ti-lowcode-datasource-dialog-demo-border-color);
        border-radius: 2px;
      }
    }
  }

  .monaco-editor {
    height: 120px;
    margin-top: 8px;
  }
}
</style>
