<template>
  <div class="response-data">
    <div class="resonse-header">
      <div class="life-cycle-alert">
        仅用于方便地设置数据源字段，从接口的响应数据列表中，选一条对象结构的数据，粘贴至下方的编辑器中，点击右上角“保存”，将会读取该对象的字段，并引导设置是否启用字段。
      </div>
    </div>
    <div id="remote-data-editor" class="tor">
      <div class="operate">
        <tiny-button plain @click="check">查看已获取的字段</tiny-button>
        <tiny-button plain @click="copyData">复制代码</tiny-button>
      </div>
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
import { Button as TinyButton } from '@opentiny/vue'

import useClipboard from 'vue-clipboard3'

const editor = ref(null)

export const getResponseData = () => editor.value.getEditor().getValue()

export default {
  components: {
    MonacoEditor,
    TinyButton
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
        language: 'json',
        minimap: { enabled: true }
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
    const check = () => {
      emit('check')
    }
    const handleChange = (val) => {
      state.value = val
    }

    return {
      state,
      copyData,
      check,
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
    margin-bottom: 16px;

    .life-cycle-alert {
      font-size: 11px;
      color: var(--ti-lowcode-datasource-tip-color);
    }
    .title {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      display: inline-block;
      border-bottom: 1px solid var(--ti-lowcode-datasource-tabs-border-color);
      width: 100%;
      padding-bottom: 8px;
    }
  }

  #remote-data-editor {
    position: relative;
  }

  .operate {
    position: absolute;
    right: 8px;
    top: 8px;
    z-index: 9999;
    .tiny-button {
      border-radius: 4px;
      border-color: var(--te-common-border-default);
    }
  }

  .monaco-editor {
    height: 120px;
    margin-top: 8px;
    border: 1px solid var(--ti-lowcode-base-gray-101);
    border-radius: 4px;
  }
}
</style>
