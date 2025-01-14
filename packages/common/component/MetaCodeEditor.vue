<template>
  <div class="editor-wrap">
    <slot :open="open">
      <div v-if="buttonShowContent" :class="['full-width', { 'empty-color': value === '' }]" @click="open">
        <span class="text-content text-ellipsis-multiple text-line-clamp">{{
          value === '' ? buttonLabel : value
        }}</span>
        <svg-icon class="edit-icon" name="to-edit"></svg-icon>
      </div>
      <tiny-button v-else class="edit-btn" @click="open">
        <slot name="icon"></slot>
        <svg-icon
          name="page-schema"
          v-if="[buttonText[locale], buttonText].includes(EDIT_CODE_TEXT)"
          class="edit-btn-icon"
        ></svg-icon>

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
        </div>
        <div class="source-code-split-panel-wrapper">
          <tiny-split v-model="editorState.splitWidth">
            <template #left>
              <monaco-editor
                ref="editor"
                class="source-code-content"
                :value="value"
                :options="options"
                @editorDidMount="editorDidMount"
              ></monaco-editor>
            </template>
            <template #right>
              <div v-if="editorTipsDemo" class="source-code-split-panel-wrapper-right">
                <div class="header-tips-demo-content lowcode-scrollbar-thin">
                  <span>{{ $t('common.exampleCode') }}</span>
                  <pre><code>{{ editorTipsDemo }}</code></pre>
                </div>
              </div>
            </template>
          </tiny-split>
        </div>
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
import { computed, nextTick, reactive, ref, watchEffect } from 'vue'
import { Button, DialogBox, Split } from '@opentiny/vue'
import VueMonaco from './VueMonaco.vue'
import { formatString } from '../js/ast'
import i18n from '../js/i18n'

export default {
  components: {
    TinySplit: Split,
    MonacoEditor: VueMonaco,
    TinyButton: Button,
    TinyDialogBox: DialogBox
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
      default: '编辑代码'
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
      showEditorDemo: false,
      splitWidth: props.tips?.demo ? 0.7 : 1
    })
    const value = ref('')
    const editor = ref(null)

    const buttonLabel = computed(() => props.buttonText?.[locale.value] ?? props.buttonText)

    const titleLabel = computed(() => props.title?.[locale.value] ?? props.title)

    const editorTipsTitle = computed(() => props.tips?.title?.[locale.value] ?? props.tips?.title)
    const editorTipsDemo = computed(() => props.tips?.demo?.[locale.value] ?? props.tips?.demo)

    const EDIT_CODE_TEXT = '编辑代码'

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
      EDIT_CODE_TEXT,
      options: {
        language: props.language,
        minimap: {
          enabled: false
        }
      },
      locale
    }
  }
}
</script>

<style lang="less" scoped>
.editor-wrap {
  width: 100%;
  display: flex;
  text-align: center;
  .tiny-button.tiny-button.edit-btn {
    color: var(--te-common-text-primary);
    border-color: var(--te-common-border-default);
    flex: 1;
    text-align: center;
    margin-right: 0;
    &:hover {
      border-color: var(--te-common-border-active);
    }
    &:focus {
      border-color: var(--te-common-border-active);
    }
    .edit-btn-icon {
      font-size: 14px;
      margin-right: 4px;
      vertical-align: text-top;
      color: var(--te-common-icon-secondary);
    }
  }
}

.btn-box {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  &:has(.format-btn) {
    justify-content: space-between;
  }
}

.full-width {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 24px;
  padding: 4px;
  padding-left: 10px;
  padding-right: 12px;
  border: 1px solid var(--ti-lowcode-meta-codeEditor-border-color);
  border-radius: var(--te-base-border-radius-1);

  &:hover {
    border-color: var(--ti-lowcode-meta-codeEditor-border-hover-color);
  }

  .text-content {
    --ellipsis-line: 1;
  }

  &.empty-color {
    color: var(--te-common-text-weaken);
  }

  .edit-icon {
    margin-left: 4px;
    flex-shrink: 0;
    cursor: pointer;
    color: var(--ti-lowcode-common-text-main-color);
  }
}

.text-line-clamp {
  -webkit-line-clamp: 1;
}
:deep(.tiny-dialog-box__header) {
  padding-bottom: 15px;
}

:deep(.tiny-dialog-box__title) {
  font-size: 14px;
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
      color: var(--te-common-text-weaken);
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  .source-code-content {
    overflow-y: auto;
    height: 100%;
    flex: 1;
  }

  .source-code-split-panel-wrapper {
    height: 100%;

    :deep(.tiny-split-trigger) {
      width: 2px;
    }

    &-right {
      padding: 16px 0 0 16px;

      pre {
        margin: 8px;
      }

      code {
        font-family: Microsoft YaHei, Microsoft YaHei-Normal;
        color: var(--te-common-text-weaken);
      }
    }
  }

  .error-msg {
    margin-top: 8px;
    color: var(--ti-lowcode-meta-code-editor-err-msg-color);
    font-weight: bold;
  }
}
</style>
