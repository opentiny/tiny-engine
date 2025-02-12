<template>
  <tiny-form
    ref="storeDataForm"
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
      <tiny-collapse-item :title="STATE" :name="STATE">
        <tiny-form-item :prop="STATE">
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
            <template #fullscreenHead>
              <state-fullscreen-head :title="STATE" @close="cancel"></state-fullscreen-head>
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
      <tiny-collapse-item :title="GETTERS" :name="GETTERS">
        <tiny-form-item :prop="GETTERS">
          <monaco-editor ref="gettersEditor" class="store-editor" :options="options" :value="getters">
            <template #fullscreenHead>
              <state-fullscreen-head :title="GETTERS" @close="cancel"></state-fullscreen-head>
            </template>
          </monaco-editor>
        </tiny-form-item>
      </tiny-collapse-item>
      <tiny-collapse-item :title="ACTIONS" :name="ACTIONS">
        <tiny-form-item :prop="ACTIONS">
          <monaco-editor ref="actionsEditor" class="store-editor" :options="options" :value="actions">
            <template #fullscreenHead>
              <state-fullscreen-head :title="ACTIONS" @close="cancel"></state-fullscreen-head>
            </template>
          </monaco-editor>
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
  emits: ['close'],
  setup(props, { emit }) {
    const STATE = 'state'
    const GETTERS = 'getters'
    const ACTIONS = 'actions'
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
        errorMessage = '输入内容不能为空'
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
      STATE: { required: true }
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

    const cancel = () => {
      emit('close')
    }

    const storeDataForm = ref(null)

    const validateForm = () => {
      return new Promise((resolve) => {
        storeDataForm.value.validate((valid) => {
          if (valid) {
            resolve()
          }
        })
      })
    }

    const clearValidateForm = () => {
      storeDataForm.value?.clearValidate()
    }

    return {
      STATE,
      GETTERS,
      ACTIONS,
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
      actions,
      cancel,
      validateForm,
      storeDataForm,
      clearValidateForm
    }
  }
}
</script>

<style lang="less" scoped>
.store-form {
  height: calc(100% - 45px);
  overflow-y: auto;
  :deep(.tiny-collapse-item__wrap) {
    padding: 0 12px;
    .tiny-collapse-item__content {
      padding: 0;
    }
  }
  :deep(.toolbar) {
    position: absolute;
    z-index: 99;
    right: 12px;
  }
  .stores {
    padding: 12px;
  }
  .tiny-form-item:not(:last-child) {
    margin-bottom: 12px;
  }

  :deep(.tiny-form-item__label) {
    color: var(--te-state-common-label-text-color);
  }

  .label-left-wrap {
    color: var(--te-state-common-label-text-color);
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

.create-content-description {
  font-size: 12px;
  color: var(--te-state-common-text-color-emphasize);
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
