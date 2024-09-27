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
    <tiny-form-item label="stores" prop="name" class="stores">
      <tiny-input v-model="state.storeData.name" placeholder="只能包含数字字母及下划线"></tiny-input>
    </tiny-form-item>
    <tiny-collapse v-model="state.activeName">
      <tiny-collapse-item title="state" name="state">
        <tiny-form-item prop="state">
          <monaco-editor
            ref="variableEditor"
            class="store-editor"
            :value="editorCode"
            :showFormatBtn="true"
            :options="{
              language: 'json',
              // 禁用滚动条边边一直显示的边框
              overviewRulerBorder: false,
              renderLineHighlightOnlyWhenFocus: true
            }"
            @editorDidMount="editorDidMount"
            @change="editorDidMount"
          >
            <template #toolbarStart>
              <div class="label-left-wrap"></div>
            </template>
          </monaco-editor>
          <div class="tips">
            <div>字符串:"string"</div>
            <div>数字:123</div>
            <div>布尔值:true/false</div>
            <div>对象:{"name":"xxx"}</div>
            <div>数组:["1","2"]</div>
            <div>空值:null</div>
            <div>"color":red</div>
            <div>"background":"blue"</div>
          </div>
        </tiny-form-item>
      </tiny-collapse-item>
      <tiny-collapse-item title="getters" name="getters">
        <tiny-form-item prop="getters">
          <monaco-editor ref="gettersEditor" class="store-editor" :options="options" :value="getters"> </monaco-editor>
        </tiny-form-item>
      </tiny-collapse-item>
      <tiny-collapse-item title="actions" name="actions">
        <tiny-form-item prop="actions">
          <monaco-editor ref="actionsEditor" class="store-editor" :options="options" :value="actions"> </monaco-editor>
        </tiny-form-item>
      </tiny-collapse-item>
    </tiny-collapse>
  </tiny-form>
</template>

<script>
import { getCurrentInstance, reactive, ref, computed, watch } from 'vue'
import { Form, FormItem, Input, Collapse as TinyCollapse, CollapseItem as TinyCollapseItem } from '@opentiny/vue'
import { MonacoEditor } from '@opentiny/tiny-engine-common'
import { string2Ast, ast2String, insertName } from '@opentiny/tiny-engine-common/js/ast'
import { verifyJsVarName } from '@opentiny/tiny-engine-common/js/verification'

export default {
  components: {
    MonacoEditor,
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinyCollapse,
    TinyCollapseItem
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
      storeData: props.storeData,
      activeName: ['state', 'getters', 'actions']
    })

    const options = {
      language: 'javascript',
      minimap: {
        enabled: false
      },
      // 禁用滚动条边边一直显示的边框
      overviewRulerBorder: false,
      renderLineHighlightOnlyWhenFocus: true
    }

    watch(
      () => state.storeData.name,
      () => {
        variableEditor.value?.switchFullScreen(false)
        gettersEditor.value?.switchFullScreen(false)
        actionsEditor.value?.switchFullScreen(false)
      }
    )

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
  height: calc(100% - 45px);
  overflow-y: auto;
  .tips {
    font-size: 11px;
    line-height: 18px;
    margin-top: 8px;
    border-radius: 4px;
    padding: 8px 14px;
    background: var(--ti-lowcode-data-source-box-bg);
    color: var(--ti-lowcode-datasource-tip-color);
  }
  :deep(.tiny-collapse-item__wrap) {
    padding: 0 12px;
  }
  :deep(.toolbar) {
    position: absolute;
    z-index: 99;
    right: 4px;
  }
  .stores {
    padding: 12px;
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
}

.create-content-description {
  font-size: 12px;
  color: var(--ti-lowcode-common-primary-color);
  margin-left: 8px;
  cursor: pointer;
}

.create-content-demo {
  padding: 12px;
  font-size: 14px;
  li + li {
    margin-top: 8px;
  }
}

.store-editor {
  height: 270px;
}
</style>
