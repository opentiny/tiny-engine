<template>
  <div class="editor-wrap">
    <slot :open="open">
      <div v-if="buttonShowContent" :class="['full-width', { 'empty-color': value === '' }]" @click="open">
        <span class="text-content text-ellipsis-multiple">{{ value === '' ? buttonLabel : value }}</span>
        <svg-icon class="edit-icon" name="edit"></svg-icon>
      </div>
      <tiny-button v-else class="edit-btn" @click="open">
        {{ buttonLabel }}
      </tiny-button>
    </slot>
    <tiny-dialog-box
      v-model:visible="editorState.show"
      :title="titleLabel"
      width="50vw"
      class="meta-code-editor-dialog-box"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="source-code">
        <div v-if="editorTipsTitle" class="header-tips-container">
          <span class="header-tips-title" :title="editorTipsTitle">{{ editorTipsTitle }}</span>
          <div
            v-if="editorTipsDemo"
            class="header-tips-showdemo"
            @click="editorState.showEditorDemo = !editorState.showEditorDemo"
          >
            <span>{{ editorState.showEditorDemo ? $t('common.collapseExample') : $t('common.expandExample') }}</span>
            <icon-chevron-up v-if="editorState.showEditorDemo" class="collapse-icon"></icon-chevron-up>
            <icon-chevron-down v-else class="collapse-icon"></icon-chevron-down>
          </div>
        </div>
        <div v-if="editorState.showEditorDemo" class="header-tips-demo">
          <div class="header-tips-demo-content lowcode-scrollbar-thin">
            <pre><code>{{ editorTipsDemo }}</code></pre>
          </div>
        </div>
        <monaco-editor
          ref="editor"
          class="source-code-content"
          :value="value"
          :options="options"
          @editorDidMount="editorDidMount"
        ></monaco-editor>
        <div v-if="showErrorMsg" class="error-msg">{{ editorState.errorMsg }}</div>
      </div>
      <template #footer>
        <div class="btn-box">
          <tiny-button
            v-if="language === 'json' && showFormatBtn"
            class="format-btn"
            plain
            type="danger"
            @click="formatCode"
          >
            {{ $t('common.format') }}
          </tiny-button>
          <div>
            <tiny-button @click="close">{{ $t('common.cancel') }}</tiny-button>
            <tiny-button type="primary" @click="save">{{ $t('common.save') }}</tiny-button>
          </div>
        </div>
      </template>
    </tiny-dialog-box>
  </div>
</template>

<script>
import { reactive, ref, computed, watchEffect, nextTick } from 'vue'
import { Button, DialogBox } from '@opentiny/vue'
import { iconChevronDown, iconChevronUp } from '@opentiny/vue-icon'
import VueMonaco from './VueMonaco.vue'
import i18n from '../js/i18n'
import { formatString } from '../js/ast.js'

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyButton: Button,
    TinyDialogBox: DialogBox,
    IconChevronDown: iconChevronDown(),
    IconChevronUp: iconChevronUp()
  },
  props: {
    buttonText: {
      type: [String, Object],
      default: '编辑代码'
    },
    modelValue: {
      type: [String, Object, Array],
      default: ''
    },
    buttonShowContent: {
      type: Boolean,
      default: false
    },
    title: {
      type: [String, Object],
      default: ''
    },
    language: {
      type: String,
      default: 'javascript'
    },
    dataType: String,
    single: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String
    },
    showFormatBtn: {
      type: Boolean,
      default: true
    },
    showErrorMsg: {
      type: Boolean,
      default: true
    },
    tips: {
      // 代码编辑器上方提示：title显示简短的文字描述，demo为显示的示例，点击 “展开示例” 可查看
      type: Object,
      default: () => ({ title: '', demo: '' })
    }
  },
  emits: ['save', 'open'],
  setup(props, { emit }) {
    const { locale } = i18n.global
    const editorState = reactive({
      show: false,
      created: false,
      errorMsg: '',
      showEditorDemo: false
    })

    const value = ref('')
    const editor = ref(null)

    const buttonLabel = computed(() => props.buttonText?.[locale.value] ?? props.buttonText)

    const titleLabel = computed(() => props.title?.[locale.value] ?? props.title)

    const editorTipsTitle = computed(() => props.tips?.title?.[locale.value] ?? props.tips?.title)
    const editorTipsDemo = computed(() => props.tips?.demo?.[locale.value] ?? props.tips?.demo)

    watchEffect(() => {
      const { modelValue, dataType } = props
      const val = dataType ? modelValue?.value || '' : modelValue
      value.value = typeof val === 'string' ? val : JSON.stringify(val, null, 2)
    })

    // 关闭编辑器
    const close = () => {
      editorState.show = false
      emit('close')
    }

    // 打开编辑器
    const open = () => {
      if (!editorState.created) {
        editorState.created = true
      }

      editorState.show = true
      emit('open')
      nextTick(() => window.dispatchEvent(new Event('resize')))
    }

    const parseContent = (content = editor.value?.getEditor().getValue()) => {
      let jsonData
      if (props.language === 'json' && content) {
        try {
          jsonData = JSON.parse(content)
          editorState.errorMsg = ''
        } catch (error) {
          editorState.errorMsg = error
        }
      }
      return jsonData
    }

    const editorDidMount = (monacoInstance) => {
      monacoInstance.onDidChangeModelContent(() => {
        const newValue = monacoInstance.getValue()
        parseContent(newValue)
      })
    }

    const formatCode = () => {
      let jsonStr = editor.value?.getEditor().getValue()
      if (jsonStr) {
        try {
          jsonStr = formatString(jsonStr, 'json')
          editor.value?.getEditor().setValue(jsonStr)
        } catch (error) {
          /* empty */
        }
      }
    }

    // 保存编辑器内容
    const save = () => {
      const { language, dataType, single } = props
      const content = formatString(editor.value?.getEditor().getValue(), language)
      emit('save', { content })

      if (!single) {
        let value = content
        const Func = Function
        try {
          if (dataType) {
            value = value === '' ? '' : { type: dataType, value }
          } else if (language === 'json') {
            // eslint-disable-next-line no-new-func
            value = new Func(`return ${content}`)()
          } else {
            value = typeof props.modelValue === 'string' ? content : JSON.parse(content)
          }
        } catch (error) {
          /* empty */
        }

        emit('update:modelValue', value)
      }

      close()
    }

    const getTheme = () => {
      const defaultTheme = window?.TinyGlobalConfig?.theme || 'light'
      return (props.theme || defaultTheme)?.includes('dark') ? 'vs-dark' : 'vs'
    }

    return {
      save,
      close,
      open,
      formatCode,
      editorDidMount,
      buttonLabel,
      titleLabel,
      editorTipsTitle,
      editorTipsDemo,
      editor,
      editorState,
      value,
      options: {
        theme: getTheme(),
        tabSize: 2,
        language: props.language,
        autoIndent: true,
        formatOnPaste: true,
        automaticLayout: true,
        roundedSelection: true,
        minimap: {
          enabled: false
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.editor-wrap {
  width: 100%;
  .edit-btn {
    color: var(--ti-lowcode-meta-codeEditor-color);
    border-color: var(--ti-lowcode-meta-codeEditor-border-color);
    &:hover {
      color: var(--ti-lowcode-meta-codeEditor-hover-color);
      border-color: var(--ti-lowcode-meta-codeEditor-border-hover-color);
    }
  }
}
.btn-box {
  display: flex;
  justify-content: flex-end;
  &:has(.format-btn) {
    justify-content: space-between;
  }
}
.full-width {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--ti-lowcode-meta-codeEditor-border-color);
  border-radius: 6px;
  &:hover {
    border-color: var(--ti-lowcode-meta-codeEditor-border-hover-color);
  }
  .text-content {
    --ellipsis-line: 1;
  }
  &.empty-color {
    color: var(--ti-lowcode-common-text-desc-color);
  }
  .edit-icon {
    margin-left: 4px;
    flex-shrink: 0;
    cursor: pointer;
    color: var(--ti-lowcode-common-text-main-color);
  }
}
.source-code {
  height: 50vh;
  display: flex;
  flex-direction: column;
  .header-tips-container {
    display: flex;
    height: 17px;
    margin-bottom: 10px;
    color: var(--ti-lowcode-meta-code-editor-header-tips-container-color);
    .header-tips-title {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
    .header-tips-showdemo {
      display: flex;
      align-items: center;
      margin-left: 10px;
      white-space: nowrap;
      cursor: pointer;
      &:hover {
        .collapse-icon {
          color: var(--ti-lowcode-meta-code-editor-header-collapse-icon-hover-color);
        }
      }
      .collapse-icon {
        margin-left: 4px;
        color: var(--ti-lowcode-meta-code-editor-header-collapse-icon-color);
      }
    }
  }
  .header-tips-demo {
    overflow: hidden;
    margin-bottom: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    color: var(--ti-lowcode-meta-code-editor-header-tips-demo-color);
    background-color: var(--ti-lowcode-meta-code-editor-header-tips-demo-bg-color);
    .header-tips-demo-content {
      max-height: 98px;
      overflow-y: auto;
    }
    pre {
      margin: 0px;
    }
    code {
      font-family: Consolas, Menlo, Monaco, Courier New, monospace, serif;
    }
  }

  .source-code-content {
    overflow-y: auto;
    flex: 1;
    border: 1px solid var(--ti-lowcode-meta-code-editor-source-code-content-border-color);
  }

  .error-msg {
    margin-top: 8px;
    color: var(--ti-lowcode-meta-code-editor-err-msg-color);
    font-weight: bold;
  }
}
</style>
