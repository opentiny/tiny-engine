<template>
  <slot>
    <div class="data-source-wrap">
      <tiny-button class="data-source-button" :reset-time="0" @click="click">{{ title }}</tiny-button>
    </div>
  </slot>
  <tiny-dialog-box
    append-to-body
    title="编写代码"
    :visible="showDialog"
    width="40%"
    @update:visible="showDialog = $event"
    @opened="open"
  >
    <tiny-collapse v-if="example" v-model="activeNames">
      <tiny-collapse-item title="查看示例" name="1">
        <pre>{{ example }}</pre>
      </tiny-collapse-item>
    </tiny-collapse>
    <monaco-editor
      v-if="showEditor"
      ref="editor"
      class="data-source-monaco"
      :value="JSON.stringify(editorValue, null, 2)"
      :options="options"
    />
    <template #footer>
      <div class="bind-dialog-footer">
        <tiny-button @click="cancel">取 消</tiny-button>
        <tiny-button type="info" @click="confirm">确 定</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script>
import { reactive, getCurrentInstance, ref, computed } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { Button, Collapse, CollapseItem, DialogBox } from '@opentiny/vue'
import { useCanvas, useProperties } from '@opentiny/tiny-engine-meta-register'
import { getExample } from '@opentiny/tiny-engine-common/js/example'

export default {
  components: {
    TinyButton: Button,
    MonacoEditor: VueMonaco,
    TinyDialogBox: DialogBox,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: [String, Array],
      default: ''
    }
  },
  setup(props, { emit }) {
    const instance = getCurrentInstance()
    const example = getExample(props.name)
    const { pageState } = useCanvas()
    const { setProp } = useProperties()

    const options = reactive({
      language: 'json',
      minimap: { enabled: false }
    })

    const pageSchema = reactive(pageState.pageSchema)
    const editorValue = computed(() => props.modelValue)
    const showEditor = ref(false)
    const showDialog = ref(false)
    const title = ref(`编辑${props.name}`)

    // 获取初始值
    if (props.name === 'imports') {
      editorValue.value = pageSchema.bridge?.imports
    } else if (props.name === 'inputs' || props.name === 'outputs') {
      editorValue.value = pageSchema[props.name]
    }

    const click = () => {
      showDialog.value = true
    }

    const cancel = () => {
      showDialog.value = false
    }

    const confirm = () => {
      const name = props.name
      const editorValue = instance.refs.editor.getEditor().getValue()
      const value = editorValue ? JSON.parse(editorValue) : editorValue

      if (name === 'imports') {
        pageSchema.bridge = {}
        pageSchema.bridge.imports = value
      } else if (name === 'inputs' || name === 'outputs') {
        pageSchema[name] = value
      } else {
        setProp(props.name, value)
        emit('codeEditConfirm', { name: props.name, value: value })
      }

      showDialog.value = false
    }

    const open = () => {
      showDialog.value = true
      showEditor.value = true
    }

    return {
      example,
      options,
      showEditor,
      showDialog,
      title,
      editorValue,
      open,
      click,
      cancel,
      confirm
    }
  }
}
</script>

<style lang="less" scoped>
.data-source-wrap {
  display: flex;
  align-items: center;

  .data-source-button {
    width: 100%;
    max-width: inherit;
    display: inline-block;
    padding: 0 8px;
  }

  .bind-dialog-footer {
    display: flex;
    justify-content: center;
    align-items: center;

    :deep(.tiny-button--default) {
      background: var(--te-props-common-button-bg-color);
    }
  }
}

.data-source-monaco {
  width: 100%;
  height: 320px;
}
</style>
