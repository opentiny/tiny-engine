<template>
  <tiny-popover
    v-model="state.showPopover"
    trigger="manual"
    width="600"
    height="330"
    :visible-arrow="false"
    popper-class="lowcode"
    @hide="onClosePopover"
  >
    <div class="popover-content">
      <icon-close class="icon-close" @click="state.showPopover = false"></icon-close>
      <monaco-editor
        ref="functionEditor"
        :showFullScreenBtn="false"
        class="function-editor"
        :value="state.editorValue"
        :options="{
          language: 'javascript',
          lineNumbers: true
        }"
      ></monaco-editor>
      <div class="editor-buttons">
        <tiny-button @click="insertFunction">插入JS方法</tiny-button>
      </div>
    </div>
    <template #reference>
      <tiny-tooltip content="插入JS函数" placement="top">
        <icon-js class="button-icon" @click="state.showPopover = true"></icon-js>
      </tiny-tooltip>
    </template>
  </tiny-popover>
</template>

<script>
import { reactive, ref } from 'vue'
import { Button, Popover, Tooltip } from '@opentiny/vue'
import { iconClose, iconJs } from '@opentiny/vue-icon'
import { MonacoEditor } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyPopover: Popover,
    TinyButton: Button,
    TinyTooltip: Tooltip,
    IconClose: iconClose(),
    IconJs: iconJs(),
    MonacoEditor
  },
  emits: ['confirm'],
  setup(props, { emit }) {
    const functionEditor = ref(null)

    const state = reactive({
      showPopover: false,
      editorValue: 'function fnName() {\r\n  \r\n}'
    })

    const onClosePopover = () => {}

    const insertFunction = () => {
      const fnCode = functionEditor.value?.getEditor?.().getValue() || ''
      emit(
        'confirm',
        `{
        "type": "JSExpression",
        "value": ${JSON.stringify(fnCode)}
      }`
      )
      state.showPopover = false
    }

    return {
      functionEditor,
      state,
      onClosePopover,
      insertFunction
    }
  }
}
</script>

<style lang="less" scoped>
.popover-content {
  text-align: right;
  .icon-close {
    margin-right: 5px;
    cursor: pointer;
  }
  .function-editor {
    height: 250px;
    margin-top: 8px;
    text-align: left;
  }
  .editor-buttons {
    margin-top: 10px;
  }
}
.buttons {
  .button-icon {
    width: 1.3em;
    height: 1.3em;
    margin-left: 10px;
    margin-bottom: 2px;
  }
}
</style>
