<template>
  <div :class="['editor-container', { 'editor-container-full': fullscreen }]">
    <div class="toolbar">
      <div class="toolbar-start">
        <slot name="toolbarStart"></slot>
      </div>
      <div class="buttons">
        <slot name="buttons"></slot>
        <tiny-tooltip v-if="showFormatBtn && options.language === 'json'" content="格式化" placement="top">
          <public-icon name="json" @click="formatCode"></public-icon>
        </tiny-tooltip>
        <span v-if="showFullScreenBtn">
          <tiny-tooltip v-if="!fullscreen" content="全屏" placement="top">
            <public-icon name="full-screen" @click="switchFullScreen(true)"></public-icon>
          </tiny-tooltip>
          <tiny-tooltip v-else content="退出全屏" placement="top">
            <public-icon name="cancel-full-screen" @click="switchFullScreen(false)"></public-icon>
          </tiny-tooltip>
        </span>
      </div>
    </div>
    <monaco-editor
      ref="editor"
      class="editor"
      :value="value"
      :options="editorOptions"
      language="javascript"
      @editorDidMount="$emit('editorDidMount', $event)"
    ></monaco-editor>
  </div>
</template>

<script>
import { computed, ref, onActivated, onDeactivated } from 'vue'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { Tooltip } from '@opentiny/vue'
import PublicIcon from './PublicIcon.vue'
import VueMonaco from './VueMonaco.vue'

export default {
  components: {
    MonacoEditor: VueMonaco,
    PublicIcon,
    TinyTooltip: Tooltip
  },
  props: {
    value: String,
    options: {
      type: Object
    },
    showFormatBtn: {
      type: Boolean,
      default: false
    },
    showFullScreenBtn: {
      type: Boolean,
      default: true
    }
  },
  emits: ['editorDidMount'],
  setup(props) {
    const editor = ref(null)
    const fullscreen = ref(false)
    const editorOptions = computed(() => {
      return {
        theme: theme(),
        tabSize: 2,
        language: 'javascript',
        autoIndent: true,
        formatOnPaste: true,
        automaticLayout: true,
        roundedSelection: true,
        lineNumbers: false,
        minimap: {
          enabled: false
        },
        ...props.options
      }
    })

    const getEditorValue = () => editor.value?.getEditor()?.getValue()

    const getEditor = () => editor.value.getEditor()

    const getValue = () => {
      let value = getEditor().getValue()
      const Func = Function
      try {
        value = new Func(`return ${value}`)()
        if (value instanceof Date) {
          return {
            type: 'JSExpression',
            value: getEditor().getValue()
          }
        }
      } catch (error) {
        // do nothing
      }

      return value
    }

    const formatCode = () => {
      const value = getValue()
      getEditor().setValue(typeof value === 'string' ? value.trim() : JSON.stringify(value, null, 2))
    }

    onActivated(() => {
      editor.value.initMonaco(editor.value.getMonaco())
    })

    onDeactivated(() => {
      editor.value.getEditor().dispose()
    })

    const switchFullScreen = (value) => {
      fullscreen.value = value
    }

    return {
      editorOptions,
      editor,
      getEditor,
      getEditorValue,
      fullscreen,
      switchFullScreen,
      getValue,
      formatCode
    }
  }
}
</script>

<style lang="less" scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.editor-container-full {
  position: fixed;
  top: var(--base-top-panel-height);
  bottom: 0;
  left: calc(var(--base-nav-panel-width) + var(--base-left-panel-width));
  right: var(--base-left-panel-width);
  z-index: 10;
  padding: 10px 16px 16px 16px;
  background-color: var(--ti-lowcode-common-component-bg);
  height: auto !important;
}

.toolbar {
  display: flex;
  margin-bottom: 4px;
  justify-content: space-between;
  align-items: center;

  .buttons {
    display: flex;
    gap: 8px;
    color: var(--ti-lowcode-component-svg-button-color);
    cursor: pointer;
    :hover {
      color: var(--ti-lowcode-component-svg-button-hover-color);
    }
  }
}

.editor {
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--ti-lowcode-state-management-monaco-editor-border-color);
  border-radius: 6px;
}
</style>
