<template>
  <tiny-form
    ref="createData"
    label-position="top"
    class="create-form"
    :model="state.createData"
    :rules="rules"
    validate-type="text"
    :inline-message="true"
  >
    <tiny-form-item label="变量名" prop="name" class="var">
      <tiny-input
        v-model="state.createData.name"
        placeholder="只能包含数字字母及下划线"
        @change="$emit('nameInput', $event)"
      ></tiny-input>
    </tiny-form-item>
    <tiny-form-item label="初始值类型" class="var-type-item">
      <tiny-radio-group v-model="state.variableType" :options="VAR_TYPES"></tiny-radio-group>
    </tiny-form-item>
    <tiny-collapse v-model="state.activeName">
      <tiny-collapse-item :title="INIT" name="initValue">
        <tiny-form-item>
          <monaco-editor
            ref="variableEditor"
            class="variable-editor"
            :value="editorCode"
            :showFormatBtn="true"
            :options="state.editorOptions"
            @editorDidMount="editorDidMount"
          >
            <template #buttons>
              <editor-i18n-tool ref="i18nToolRef" @confirm="insertContent"></editor-i18n-tool>
            </template>
            <template #fullscreenHead>
              <state-fullscreen-head :title="INIT" @close="cancel"></state-fullscreen-head>
            </template>
            <template #fullscreenFooter>
              <div class="fullscreen-footer-content">
                <state-tips></state-tips>
              </div>
            </template>
          </monaco-editor>
          <state-tips></state-tips>
        </tiny-form-item>
      </tiny-collapse-item>
      <tiny-collapse-item :title="GETTER" :name="GETTER">
        <tiny-form-item>
          <monaco-editor ref="getterEditor" class="variable-editor" :options="options" :value="state.getterEditorValue">
            <template #fullscreenHead>
              <state-fullscreen-head :title="GETTER" @close="cancel"></state-fullscreen-head>
            </template>
            <template #fullscreenFooter>
              <div class="fullscreen-footer-content">
                <div class="tips">
                  <pre>{{ getterExample }}</pre>
                </div>
              </div>
            </template>
          </monaco-editor>
          <div class="tips">
            <pre>{{ getterExample }}</pre>
          </div>
        </tiny-form-item>
      </tiny-collapse-item>
      <tiny-collapse-item :title="SETTER" :name="SETTER">
        <tiny-form-item>
          <monaco-editor ref="setterEditor" class="variable-editor" :options="options" :value="state.setterEditorValue">
            <template #fullscreenHead>
              <state-fullscreen-head :title="SETTER" @close="cancel"></state-fullscreen-head>
            </template>
            <template #fullscreenFooter>
              <div class="fullscreen-footer-content">
                <div class="tips">
                  <pre>{{ setterExample }}</pre>
                </div>
              </div>
            </template>
          </monaco-editor>
          <div class="tips">
            <pre>{{ setterExample }}</pre>
          </div>
        </tiny-form-item>
      </tiny-collapse-item>
    </tiny-collapse>
  </tiny-form>
</template>

<script>
import { reactive, ref, computed, watch, onBeforeUnmount } from 'vue'
import {
  Form,
  FormItem,
  Input,
  RadioGroup,
  Collapse as TinyCollapse,
  CollapseItem as TinyCollapseItem
} from '@opentiny/vue'
import { MonacoEditor } from '@opentiny/tiny-engine-common'
import { verifyJsVarName } from '@opentiny/tiny-engine-common/js/verification'
import { initCompletion } from '@opentiny/tiny-engine-common/js/completion'
import * as Monaco from 'monaco-editor'
import { validateMonacoEditorData } from './js/common'
import EditorI18nTool from './EditorI18nTool.vue'
import StateTips from './StateTips.vue'
import StateFullscreenHead from './StateFullscreenHead.vue'

export default {
  components: {
    MonacoEditor,
    StateTips,
    StateFullscreenHead,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinyRadioGroup: RadioGroup,
    EditorI18nTool,
    TinyCollapse,
    TinyCollapseItem
  },
  props: {
    createData: {
      type: Object
    },
    dataSource: {
      type: Object
    },
    flag: {
      type: String
    },
    updateKey: {
      type: String
    }
  },
  emits: ['nameInput', 'close'],
  setup(props, { emit }) {
    const INIT = '初始值'
    const GETTER = 'getter'
    const SETTER = 'setter'
    const variableEditor = ref(null)
    const getterEditor = ref(null)
    const setterEditor = ref(null)

    const i18nToolRef = ref(null)

    const getEditor = () => variableEditor.value

    const isAccessorData = (data) => [data?.accessor?.getter?.type, data?.accessor?.setter?.type].includes('JSFunction')
    const getPropsCreateData = () => ({
      name: '',
      ...props.createData,
      variable: isAccessorData(props.createData.variable)
        ? props.createData.variable.defaultValue
        : props.createData.variable
    })

    const DEFAULT_GETTER = 'function getter() {}'
    const DEFAULT_SETTER = 'function setter() {}'

    const LANG_TYPES = {
      JSON: 'json',
      JS: 'javascript'
    }
    const VAR_TYPES = [
      { text: 'JSON类型', label: LANG_TYPES.JSON },
      { text: 'JS表达式类型', label: LANG_TYPES.JS }
    ]
    const getVarType = () => (props.createData.variable?.type === 'JSExpression' ? LANG_TYPES.JS : LANG_TYPES.JSON)

    const state = reactive({
      errorMessage: '',
      activeName: ['initValue', 'getter', 'setter'],
      createData: getPropsCreateData(),
      variableType: getVarType(),
      getterEditorValue: props.createData.variable?.accessor?.getter?.value || DEFAULT_GETTER,
      setterEditorValue: props.createData.variable?.accessor?.setter?.value || DEFAULT_SETTER,
      editorOptions: {
        language: getVarType(),
        lineNumbers: true,
        // 禁用滚动条边边一直显示的边框
        overviewRulerBorder: false,
        renderLineHighlightOnlyWhenFocus: true,
        quickSuggestions: false, // 快速提示禁用，避免调用其他模块提供的函数，因为变量是最先初始化
        suggest: {
          showFields: false,
          showFunctions: false
        }
      },
      completionProvider: null
    })

    const changeLanguage = (language) => {
      state.editorOptions.language = language
      Monaco.editor.setModelLanguage(variableEditor.value.getEditor().getModel(), language)
    }

    watch(
      () => props.createData.variable,
      () => {
        state.errorMessage = ''
        state.getterEditorValue = props.createData.variable?.accessor?.getter?.value || DEFAULT_GETTER
        state.setterEditorValue = props.createData.variable?.accessor?.setter?.value || DEFAULT_SETTER
        state.variableType = getVarType()
        if (state.editorOptions.language !== state.variableType) {
          changeLanguage(state.variableType)
        }
      }
    )

    watch(
      () => [props.createData.name, props.createData.variable],
      () => {
        state.createData = getPropsCreateData()
      }
    )

    watch(
      () => props.createData.name,
      () => {
        variableEditor.value?.switchFullScreen(false)
        getterEditor.value?.switchFullScreen(false)
        setterEditor.value?.switchFullScreen(false)
      }
    )

    watch(
      () => state.variableType,
      () => {
        changeLanguage(state.variableType)
      }
    )

    const validate = () => {
      if (state.errorMessage) {
        return { success: false, message: state.errorMessage }
      }
      // JS表达式不进行校验
      if (state.variableType === LANG_TYPES.JS) {
        return { success: true }
      }
      return validateMonacoEditorData(variableEditor.value, '初始数据')
    }

    const getDefaultValue = () => {
      // JS表达式使用字符串值，不进行解析
      if (state.variableType === LANG_TYPES.JS) {
        return { type: 'JSExpression', value: getEditor().getEditor().getValue() }
      }
      return getEditor().getValue()
    }

    const getFormData = () => {
      const defaultValue = getDefaultValue()

      const getter = getterEditor.value.getEditor().getValue()
      const setter = setterEditor.value.getEditor().getValue()
      if (!getter && !setter) return defaultValue

      const result = { defaultValue }

      if (getter && getter !== DEFAULT_GETTER) {
        result.accessor = { ...result.accessor, getter: { type: 'JSFunction', value: getter } }
      }

      if (setter && setter !== DEFAULT_SETTER) {
        result.accessor = { ...result.accessor, setter: { type: 'JSFunction', value: setter } }
      }

      // 没有设置 getter setter，需要直接返回 defaultValue
      if (!result.accessor) {
        return defaultValue
      }

      return result
    }

    const validateName = (rule, name, callback) => {
      state.errorMessage = ''

      if (!name) {
        state.errorMessage = 'state 属性名称未定义'
      } else if (!verifyJsVarName(name)) {
        state.errorMessage = ' state 属性名称只能以字母或下划线开头且仅包含数字字母及下划线'
      } else if (
        Object.keys(props.dataSource).includes(name) &&
        (props.flag !== 'update' || name !== props.updateKey)
      ) {
        state.errorMessage = '已存在同名 state 属性'
      }

      state.errorMessage ? callback(new Error(state.errorMessage)) : callback()
    }

    const rules = {
      name: { validator: validateName, required: true }
    }

    const editorCode = computed(() => {
      const { type, value } = state.createData.variable || {}

      if (type === 'JSExpression') {
        return value
      }

      return JSON.stringify(state.createData.variable, null, 2)
    })

    const addContextMenu = (editorInstance, id, label, handler) => {
      editorInstance.addAction({
        id,
        label,
        precondition: null,
        keybindingContext: null,
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1,
        run: handler
      })
    }

    const editorDidMount = (editorInstance) => {
      addContextMenu(editorInstance, 'addI18n', '插入词条', () => {
        i18nToolRef.value.state.showPopover = true
      })

      // 支持对象类型数据或表达式，不显示语法校验报错
      const diagnosticsOptions = variableEditor.value.editor
        .getMonaco()
        .languages?.typescript?.javascriptDefaults.getDiagnosticsOptions()
      variableEditor.value.editor.getMonaco().languages?.typescript?.javascriptDefaults.setDiagnosticsOptions({
        ...diagnosticsOptions,
        noSyntaxValidation: true,
        noSemanticValidation: true
      })
      if (variableEditor.value) {
        state.completionProvider = initCompletion(
          variableEditor.value.editor.getMonaco(),
          variableEditor.value.editor.getEditor()?.getModel(),
          (item) => item.label !== 'this.state' && !item.label.startsWith('this.state.')
        )
      }
    }

    onBeforeUnmount(() => {
      state.completionProvider?.forEach((provider) => {
        provider.dispose()
      })
    })

    const insertContent = (insertText = '') => {
      const monacoEditor = getEditor().editor.getEditor()
      const selection = monacoEditor.getSelection()
      const range = new Monaco.Range(
        selection?.startLineNumber || 1,
        selection?.startColumn || 1,
        selection?.endLineNumber || 1,
        selection?.endColumn || 1
      )

      monacoEditor.executeEdits('', [{ range, text: insertText }])
      getEditor().formatCode()
      monacoEditor.focus()
    }

    const cancel = () => {
      emit('close')
    }

    const options = {
      lineNumbers: true,
      language: 'javascript',
      // 禁用滚动条边边一直显示的边框
      overviewRulerBorder: false,
      renderLineHighlightOnlyWhenFocus: true
    }
    const getterExample =
      'function getter() {\r\n  // this.state.name = `${this.props.firstName} ${this.props.lastName}`\r\n}' // eslint-disable-line
    const setterExample =
      "function setter() {\r\n  // const [firstName, lastName] = this.state.name.split(' ')\r\n  // this.emit('update:firstName', firstName)\r\n  // this.emit('update:lastName', lastName)\r\n}" // eslint-disable-line

    return {
      INIT,
      GETTER,
      SETTER,
      state,
      VAR_TYPES,
      variableEditor,
      getterEditor,
      setterEditor,
      i18nToolRef,
      editorCode,
      rules,
      options,
      getterExample,
      setterExample,
      getEditor,
      validateName,
      editorDidMount,
      validate,
      getFormData,
      insertContent,
      cancel
    }
  }
}
</script>

<style lang="less" scoped>
.create-form {
  height: calc(100% - 45px);
  overflow-y: auto;
  .tips {
    font-size: 12px;
    line-height: 18px;
    margin-top: 8px;
    border-radius: 4px;
    padding: 8px 14px;
    background: var(--te-common-bg-container);
    color: var(--te-common-text-weaken);
    & > pre {
      font-family: Consolas, 'Courier New', monospace;
    }
  }
  :deep(.toolbar) {
    position: absolute;
    z-index: 99;
    right: 12px;
  }
  .var {
    padding: 12px 12px 0 12px;
  }
  .var-type-item {
    padding: 0 12px;
  }
  .tiny-form-item:not(:last-child) {
    margin-bottom: 12px;
  }

  :deep(.tiny-form-item__label) {
    color: var(--ti-lowcode-toolbar-icon-color);
  }

  .label-left-wrap {
    color: var(--ti-lowcode-toolbar-icon-color);
    display: flex;
  }
  :deep(.tiny-collapse-item__wrap) {
    padding: 0 12px;
    .tiny-collapse-item__content {
      padding: 0;
      .tiny-form-item:first-child {
        padding-bottom: 12px;
      }
    }
  }
}

.tips-content {
  padding: 12px;
  .create-content-head {
    display: flex;
    flex: 1;
    font-size: 12px;

    .icon-info-circle {
      font-size: 14px;
      margin-right: 4px;
      color: var(--ti-lowcode-toolbar-icon-color);
    }
  }
  .create-content-tip {
    font-size: 14px;
  }

  .create-content-demo {
    font-size: 14px;
    .ml20 {
      margin-left: 20px;
    }
    li {
      margin-top: 8px;
    }
  }
  .create-content-foot {
    margin-top: 4px;
    font-size: 14px;
    line-height: 22px;
  }
}

.create-content-description {
  font-size: 12px;
  color: var(--ti-lowcode-common-primary-color);
  margin-left: 8px;
  cursor: pointer;
}

.variable-editor {
  height: 270px;
}

.show-advanced {
  font-size: 12px;
  color: var(--ti-lowcode-data-advanced-text-color);
  &:hover {
    color: var(--ti-lowcode-data-advanced-text-hover-color);
    cursor: pointer;
  }
}
</style>

<style lang="less">
.tiny-popover.tiny-popper.state-data-example-tips {
  background-color: var(--ti-lowcode-data-example-bg-color);
  color: var(--ti-lowcode-data-example-color);

  &[x-placement^='bottom'] .popper__arrow {
    &,
    &::after {
      border-bottom-color: var(--ti-lowcode-data-example-bg-color);
    }
  }

  &[x-placement^='top'] .popper__arrow {
    &,
    &::after {
      border-top-color: var(--ti-lowcode-data-example-bg-color);
    }
  }
}
</style>
