<template>
  <tiny-dialog-box
    :visible="$attrs.visible"
    title="发布区块"
    width="550px"
    append-to-body
    draggable
    @update:visible="setVisible"
  >
    <tiny-form
      ref="deployBlockRef"
      label-position="left"
      label-width="100px"
      label-align
      :model="formState"
      :rules="formRules"
    >
      <tiny-form-item label="版本号" prop="version">
        <tiny-input v-model="formState.version" placeholder="请输入X.Y.Z格式版本号，如1.0.0"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="版本描述" prop="deployInfo">
        <tiny-input v-model="formState.deployInfo" type="textarea" placeholder="请输入此次发布的修改点"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="保存设置" prop="needToSave" class="form-item-save">
        <tiny-checkbox v-model="formState.needToSave">发布成功后保存最新数据</tiny-checkbox>
      </tiny-form-item>
      <tiny-form-item label="schema比对">
        <tiny-button class="compare-button" type="text" @click="changeCompare"> 查看本次发布的改动点 </tiny-button>
        <tiny-popover
          placement="top"
          trigger="hover"
          append-to-body
          :width="162"
          content="区块本地schema和线上新版本schema进行比对"
        >
          <template #reference>
            <icon-help-circle></icon-help-circle>
          </template>
        </tiny-popover>
      </tiny-form-item>
    </tiny-form>
    <template #footer>
      <tiny-button type="primary" @click="deployBlock"> 确定 </tiny-button>
      <tiny-button @click="setVisible(false)">取消</tiny-button>
    </template>
    <tiny-dialog-box
      v-model:visible="state.compareVisible"
      class="dialog-box"
      :modal="false"
      :fullscreen="true"
      :append-to-body="true"
      title="Schema 线上与本地差异"
    >
      <vue-monaco
        v-if="state.compareVisible"
        ref="editor"
        class="monaco-editor"
        :diffEditor="true"
        :options="editorOptions"
        :value="state.code"
        :original="state.originalCode"
        @change="changeCode"
      ></vue-monaco>
      <template #footer>
        <tiny-button type="primary" @click="save">保存</tiny-button>
        <tiny-button @click="close">取消</tiny-button>
      </template>
    </tiny-dialog-box>
  </tiny-dialog-box>
</template>

<script>
import { reactive, ref, watch } from 'vue'
import { iconHelpCircle } from '@opentiny/vue-icon'
import {
  Checkbox as TinyCheckbox,
  Input as TinyInput,
  Button as TinyButton,
  DialogBox as TinyDialogBox,
  Form as TinyForm,
  Popover as TinyPopover,
  FormItem as TinyFormItem
} from '@opentiny/vue'
import { theme } from '@opentiny/tiny-engine-controller/adapter'
import { useLayout, useNotify } from '@opentiny/tiny-engine-controller'
import { getSchema, setSchema } from '@opentiny/tiny-engine-canvas'
import { constants } from '@opentiny/tiny-engine-utils'
import VueMonaco from './VueMonaco.vue'

export default {
  components: {
    TinyCheckbox,
    IconHelpCircle: iconHelpCircle(),
    TinyButton,
    TinyDialogBox,
    TinyForm,
    TinyInput,
    TinyFormItem,
    TinyPopover,
    VueMonaco
  },
  props: {
    nextVersion: {
      type: String,
      default: ''
    }
  },
  emits: ['update:visible'],
  setup(props, { emit, attrs }) {
    const { COMPONENT_NAME } = constants
    const formState = reactive({
      deployInfo: '',
      version: '',
      needToSave: true
    })

    const state = reactive({
      compareVisible: false,
      schemaCompare: false,
      code: '',
      originalCode: '',
      newCode: ''
    })

    const deployBlockRef = ref(null)

    const formRules = {
      deployInfo: [{ required: true, message: '必填', trigger: 'blur' }],
      version: [
        { required: true, message: '必填', trigger: 'blur' },
        { type: 'version', message: '请输入正确的X.Y.Z版本格式', trigger: 'blur' }
      ]
    }

    const editor = ref(null)
    const editorOptions = {
      theme: theme(),
      tabSize: 2,
      language: 'javascript',
      autoIndent: true,
      lineNumbers: true,
      formatOnPaste: true,
      automaticLayout: true,
      roundedSelection: true,
      minimap: {
        enabled: false
      }
    }

    watch(
      () => attrs.visible,
      (visible) => {
        if (visible && !formState.version) {
          formState.version = props.nextVersion
        }
      }
    )

    const setVisible = (visible) => emit('update:visible', visible)

    const deployBlock = async () => {
      deployBlockRef.value.validate((valid) => {
        const { PLUGIN_NAME, getPluginApi } = useLayout()
        const { getEditBlock, publishBlock } = getPluginApi(PLUGIN_NAME.BlockManage)
        if (valid) {
          const params = {
            block: getEditBlock(),
            is_compile: true,
            deploy_info: formState.deployInfo,
            version: formState.version,
            needToSave: formState.needToSave
          }
          publishBlock(params)
          setVisible(false)
          formState.deployInfo = ''
          formState.version = ''
          formState.needToSave = true
        }
      })
    }

    const changeCompare = async (value) => {
      const { PLUGIN_NAME, getPluginApi } = useLayout()
      const { getEditBlock } = getPluginApi(PLUGIN_NAME.BlockManage)
      if (value) {
        const api = getPluginApi(PLUGIN_NAME.BlockManage)
        const block = getEditBlock()
        const remote = await api.getBlockById(block?.id)
        const originalObj = remote?.content || {}
        state.originalCode = JSON.stringify(originalObj, null, 2)

        // 转为普通对象，和线上代码顺序保持一致
        const pageSchema = getSchema() || {}
        if (pageSchema.componentName === 'Block') {
          state.code = JSON.stringify(pageSchema, null, 2)
        } else {
          // 非区块编辑
          state.code = state.originalCode
        }
        state.compareVisible = true
      }
    }

    const changeCode = (code) => {
      if (typeof code !== 'string') {
        return
      }
      state.newCode = code
    }

    const close = () => {
      state.schemaCompare = false
      state.compareVisible = false
    }

    const save = () => {
      if (!state.newCode) {
        close()
        return
      }
      try {
        const pageSchema = JSON.parse(state.newCode)
        setSchema({ ...pageSchema, componentName: COMPONENT_NAME.Block })
        close()
      } catch (err) {
        useNotify({
          type: 'error',
          message: '代码静态检查有错误，请先修改后再保存'
        })
      }
    }

    return {
      formState,
      state,
      deployBlockRef,
      formRules,
      editor,
      editorOptions,
      setVisible,
      changeCompare,
      changeCode,
      close,
      save,
      deployBlock
    }
  }
}
</script>

<style lang="less" scoped>
.dialog-box {
  :deep(.tiny-dialog-box__body) {
    height: 100%;
  }
}
.monaco-editor {
  width: 100%;
  height: 100%;
}
.form-item-save {
  :deep(.tiny-form-item__content) {
    line-height: 0;
  }
}
.compare-button {
  padding-left: 0;
  padding-right: 8px;
  line-height: 28px;
  vertical-align: middle;
}
</style>
