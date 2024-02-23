<template>
  <tiny-form
    ref="storeData"
    class="store-form"
    :model="storeData"
    label-position="top"
    :rules="rules"
    label-width="15%"
    validate-type="text"
    :inline-message="true"
  >
    <tiny-form-item label="stores" prop="name">
      <tiny-input v-model="state.storeData.name" placeholder="只能包含数字字母及下划线"></tiny-input>
    </tiny-form-item>
    <tiny-form-item prop="state" class="monaco-form-item">
      <template #label>
        <div class="label-left-wrap">
          <span>state</span>
          <tiny-popover placement="bottom-start" effect="dark" trigger="hover" popper-class="state-data-example-tips">
            <div class="tips-content">
              <div class="create-content-demo">
                <ul>
                  <li>state为对象(一个对象内可包含多个属性): {"name": "xxx"}</li>
                  <li>actions/getters为函数(可写多个函数): function count(){}</li>
                </ul>
              </div>
            </div>
            <template #reference>
              <div class="create-content-description">查看示例</div>
            </template>
          </tiny-popover>
        </div>
      </template>
      <monaco-editor
        ref="variableEditor"
        class="store-editor"
        :value="editorCode"
        :showFormatBtn="true"
        :options="{
          language: 'json',
          tabSize: 2,
          // 禁用滚动条边边一直显示的边框
          overviewRulerBorder: false,
          renderLineHighlightOnlyWhenFocus: true
        }"
        @editorDidMount="editorDidMount"
        @change="editorDidMount"
      />
    </tiny-form-item>
    <tiny-form-item label="getters" prop="getters" class="store-form-item monaco-form-item">
      <monaco-editor ref="gettersEditor" class="store-editor" :options="options" :value="getters" />
    </tiny-form-item>
    <tiny-form-item label="actions" prop="actions" class="store-form-item monaco-form-item">
      <monaco-editor ref="actionsEditor" class="store-editor" :options="options" :value="actions" />
    </tiny-form-item>
  </tiny-form>
</template>

<script>
import { getCurrentInstance, reactive, ref, computed } from 'vue'
import { Form, FormItem, Input, Popover } from '@opentiny/vue'
import { MonacoEditor } from '@opentiny/tiny-engine-common'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { string2Ast, ast2String, insertName } from '@opentiny/tiny-engine-controller/js/ast'
import { verifyJsVarName } from '@opentiny/tiny-engine-controller/js/verification'

export default {
  components: {
    MonacoEditor,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinyPopover: Popover
  },
  props: {
    storeData: {
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
  setup(props, { emit }) {
    const instance = getCurrentInstance()
    const isDemoShow = ref(false)
    const gettersEditor = ref(null)
    const actionsEditor = ref(null)
    const variableEditor = ref(null)
    const state = reactive({
      storeData: props.storeData
    })

    const options = {
      roundedSelection: true,
      automaticLayout: true,
      autoIndent: true,
      language: 'javascript',
      formatOnPaste: true,
      tabSize: 2,
      theme: theme(),
      minimap: {
        enabled: false
      },
      // 禁用滚动条边边一直显示的边框
      overviewRulerBorder: false,
      renderLineHighlightOnlyWhenFocus: true
    }

    const validateName = (rule, name, callback) => {
      let errorMessage = ''
      let isSameState = Object.keys(props.dataSource).includes(name)
      if (!name) {
        errorMessage = 'store 属性名称未定义'
      }

      if (!verifyJsVarName(name)) {
        errorMessage = ' store 属性名称只能以字母或下划线开头且仅包含数字字母及下划线'
      }

      if (isSameState && (props.flag !== 'update' || name !== props.updateKey)) {
        errorMessage = '已存在同名 store 属性'
      }

      errorMessage ? callback(new Error(errorMessage)) : callback()
      emit('nameInput', errorMessage)
    }
    const rules = {
      name: { validator: validateName, required: true },
      state: { required: true }
    }
    const editorCode = computed(() => {
      const { state: storeState } = state.storeData.variable || {}
      if (storeState) {
        return JSON.stringify(storeState, null, 2)
      }
      return ''
    })

    const getEditor = () => instance.refs.variableEditor

    const getScriptString = (res) => {
      const list = Object.entries(res).map(([name, method]) => insertName(name, method.value))
      const script = list.join(`\n`)
      return script
    }

    const getters = computed(() => {
      const { getters } = state.storeData.variable || {}
      if (getters) {
        return getScriptString(getters)
      }
      return ''
    })
    const actions = computed(() => {
      const { actions } = state.storeData.variable || {}
      if (actions) {
        return getScriptString(actions)
      }
      return ''
    })

    const saveMethod = ({ name, content }) => {
      if (!name) {
        return undefined
      }

      return { [name]: { type: 'JSFunction', value: content } }
    }

    const saveMethods = (editor) => {
      const storeEditor = editor === 'gettersEditor' ? gettersEditor : actionsEditor
      let gettersMap = {}
      const editorContent = storeEditor?.value?.getEditor()?.getValue()
      const ast = string2Ast(editorContent)

      ast.program.body.forEach((declaration) => {
        const name = declaration?.id?.name
        const content = ast2String(declaration).trim()
        Object.assign(gettersMap, saveMethod({ name, content }))
      })

      return gettersMap
    }

    const editorDidMount = () => {
      const variable = variableEditor.value
        .getEditor()
        .getValue()
        .replace(new RegExp('\\r\\n', 'g', ''), '')
        .replace(/\s/g, '')

      return Object.prototype.toString.call(variable) === '[object Object]'
    }

    return {
      isDemoShow,
      state,
      getEditor,
      editorCode,
      rules,
      getters,
      options,
      gettersEditor,
      getScriptString,
      saveMethods,
      actionsEditor,
      editorDidMount,
      variableEditor,
      actions
    }
  }
}
</script>

<style lang="less" scoped>
.store-form {
  padding: 12px;

  .error-tip {
    color: var(--ti-lowcode-error-tip-color);
    margin-top: 4px;
    font-size: 12px;
  }

  .textarea-warp {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  :deep(.tiny-form-item__label) {
    color: var(--ti-lowcode-toolbar-icon-color);
  }
  &-item {
    margin-top: 30px;
  }

  .tiny-form-item {
    :deep(.tiny-form-item__label) {
      color: var(--ti-lowcode-toolbar-icon-color);
      .label-left-wrap {
        display: flex;
      }
    }
    &.monaco-form-item {
      :deep(.tiny-form-item__label) {
        position: relative;
        z-index: 1;
        margin-bottom: -36px;
      }
      &.is-required {
        :deep(.tiny-form-item__label) {
          .label-left-wrap {
            margin-left: 10px;
          }
          &::before {
            position: absolute;
          }
        }
      }
    }

    .create-content-description {
      color: var(--ti-lowcode-description-color);
      margin-left: 8px;
      cursor: pointer;
    }
  }
}
.create-content-demo {
  padding: 12px;
  font-size: 12px;
  li + li {
    margin-top: 8px;
  }
}

.store-editor {
  height: 200px;
}
</style>
