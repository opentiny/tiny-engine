<template>
  <div :class="['editor-container', { 'editor-container-full': fullscreen }]">
    <slot v-if="fullscreen" name="fullscreenHead"></slot>
    <div class="editor-container-content">
      <div class="toolbar">
        <div class="toolbar-start">
          <slot name="toolbarStart"></slot>
        </div>
        <div :class="['buttons', { 'monaco-btn-fullscreen': fullscreen }]" id="icon-buttons">
          <slot name="buttons"></slot>
          <tiny-tooltip
            v-if="showFormatBtn && options.language === 'json'"
            content="格式化"
            placement="top"
            :open-delay="OPEN_DELAY.Default"
            effect="light"
          >
            <public-icon name="json" @click="formatCode"></public-icon>
          </tiny-tooltip>
          <span v-if="showFullScreenBtn">
            <tiny-tooltip
              v-if="!fullscreen"
              effect="light"
              content="全屏"
              placement="top"
              :open-delay="OPEN_DELAY.Default"
            >
              <public-icon name="full-screen" @click="switchFullScreen(true)"></public-icon>
            </tiny-tooltip>
            <tiny-tooltip v-else content="退出全屏" effect="light" placement="top" :open-delay="OPEN_DELAY.Default">
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
        @shortcutSave="$emit('shortcutSave', $event)"
        @change="$emit('change', $event)"
      ></monaco-editor>
    </div>
    <slot v-if="fullscreen" name="fullscreenFooter"></slot>
  </div>
</template>

<script>
import { computed, ref, onActivated, onDeactivated } from 'vue'
import { Tooltip } from '@opentiny/vue'
import PublicIcon from './PublicIcon.vue'
import VueMonaco from './VueMonaco.vue'
import { constants } from '@opentiny/tiny-engine-utils'
const { OPEN_DELAY } = constants

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
  emits: ['editorDidMount', 'change', 'fullscreenChange', 'shortcutSave'],
  setup(props, { emit }) {
    const editor = ref(null)
    const fullscreen = ref(false)
    const editorOptions = computed(() => {
      return {
        language: 'javascript',
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
      emit('fullscreenChange', value)
    }

    return {
      editorOptions,
      editor,
      getEditor,
      getEditorValue,
      fullscreen,
      switchFullScreen,
      getValue,
      formatCode,
      OPEN_DELAY
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
  right: var(--base-right-panel-width);
  z-index: 100;
  padding: 10px 16px 16px 16px;
  background-color: var(--te-component-common-bg-color);
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
    color: var(--te-component-common-text-color-primary);
    cursor: pointer;
  }
  #icon-buttons {
    :deep(.svg-icon) {
      color: var(--te-component-common-text-color-secondary);
    }
  }
  .monaco-btn-fullscreen {
    display: flex;
    margin-right: 20px;
  }
}

.editor-container-content {
  flex: 1;
  overflow: hidden;
}

.editor {
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--te-component-common-border-color-hover);
  border-radius: 6px;
}
</style>
