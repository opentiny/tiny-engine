<template>
  <plugin-setting v-if="isOpen">
    <template #title>
      <div class="title-wrap">
        <span>{{ state.title }}</span>
      </div>
    </template>
    <template #header>
      <button-group>
        <tiny-button class="save-btn" type="primary" @click="save">保存</tiny-button>
        <svg-button v-if="state.status" class="delete-btn" name="delete" @click="deleteReSource"></svg-button>
        <svg-button class="close-btn" name="close" @click="closePanel"></svg-button>
      </button-group>
    </template>
    <template #content>
      <tiny-form
        ref="resourceForm"
        class="resource-form"
        :rules="rules"
        :model="state"
        validate-type="text"
        :inline-message="true"
        label-position="top"
        :label-align="true"
      >
        <div class="right-item">
          <tiny-form-item v-if="!state.status" label="工具类型" prop="type">
            <tiny-radio-group v-model="state.type" class="resource-type-radio-group" @change="handleChangeType">
              <tiny-radio :label="RESOURCE_CATEGORY.Npm">
                {{ RESOURCE_CATEGORY.Npm }}
              </tiny-radio>
              <tiny-radio :label="RESOURCE_CATEGORY.Function">
                {{ RESOURCE_CATEGORY.Function }}
              </tiny-radio>
            </tiny-radio-group>
          </tiny-form-item>
          <tiny-form-item v-if="!state.status" label="工具名称" prop="name">
            <tiny-input v-model="state.name" placeholder="请输入工具类名称"></tiny-input>
          </tiny-form-item>
          <div v-if="state.category">
            <tiny-form-item label="npm包名" prop="content.package">
              <tiny-input v-model="state.content.package" placeholder="请输入npm包名称"></tiny-input>
            </tiny-form-item>
            <tiny-form-item label="npm包导出名" prop="content.exportName">
              <tiny-input v-model="state.content.exportName" placeholder="请输入npm包的导出名称"></tiny-input>
            </tiny-form-item>
            <tiny-form-item label="">
              <tiny-checkbox v-model="state.content.destructuring">解构npm包</tiny-checkbox>
            </tiny-form-item>
            <tiny-form-item v-if="state.mode" label="是否作为实例">
              <tiny-checkbox v-model="state.isInstance"></tiny-checkbox>
            </tiny-form-item>
            <tiny-form-item v-if="state.isInstance" label="实例名称" prop="content.instanceName">
              <tiny-input v-model="state.content.instance"></tiny-input>
            </tiny-form-item>
            <tiny-form-item label="入口路径">
              <tiny-input v-model="state.content.main" placeholder="main"></tiny-input>
            </tiny-form-item>
            <tiny-form-item label="版本号">
              <tiny-input v-model="state.content.version" placeholder="latest"></tiny-input>
            </tiny-form-item>
            <tiny-form-item>
              <template #label>
                <div class="cdn-label-wrap">
                  <span>CDN</span>
                </div>
              </template>
              <tiny-input v-model="state.content.cdnLink" placeholder="CDN"></tiny-input>
              <div class="tip">浏览器直接可用的生产包链接，请确保可用，否则可能会造成页面预览失败</div>
            </tiny-form-item>
            <tiny-form-item label="生成utils.js代码预览">
              <div class="code-preview">
                <pre>{{ codePreview }}</pre>
              </div>
            </tiny-form-item>
          </div>
          <monaco-editor
            v-else
            ref="editor"
            :value="state.value"
            class="monaco-editor"
            :options="options"
          ></monaco-editor>
        </div>
      </tiny-form>
    </template>
  </plugin-setting>
</template>

<script>
import { computed, onMounted, reactive, ref, watchEffect, nextTick, watch } from 'vue'
import {
  Input as TinyInput,
  Button as TinyButton,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Checkbox as TinyCheckbox,
  Radio,
  RadioGroup
} from '@opentiny/vue'
import {
  ACTION_TYPE,
  RESOURCE_TYPE,
  RESOURCE_CATEGORY,
  getType,
  deleteData,
  getCategory,
  setCategory,
  getResource,
  saveResource,
  getActionType,
  getResourceNamesByType
} from './js/resource'
import { VueMonaco as MonacoEditor, PluginSetting, SvgButton, ButtonGroup } from '@opentiny/tiny-engine-common'
import { useModal, useNotify, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'

const isOpen = ref(false)

export const openPanel = () => {
  isOpen.value = true
  nextTick(() => window.dispatchEvent(new Event('resize')))
}

export const closePanel = () => {
  isOpen.value = false
}

export default {
  components: {
    TinyForm,
    TinyInput,
    TinyButton,
    TinyFormItem,
    TinyCheckbox,
    PluginSetting,
    MonacoEditor,
    TinyRadioGroup: RadioGroup,
    TinyRadio: Radio,
    SvgButton,
    ButtonGroup
  },
  setup(props, { emit }) {
    const monacoOptions = {
      language: 'javascript',
      mouseStyle: 'default',
      minimap: { enabled: false },
      // 禁用滚动条边边一直显示的边框
      overviewRulerBorder: false,
      renderLineHighlightOnlyWhenFocus: true
    }
    const { confirm } = useModal()

    const state = reactive({
      resource: computed(() => getResource()),
      name: '',
      value: '',
      content: {},
      status: computed(() => getActionType() === ACTION_TYPE.Edit),
      category: computed(() => getCategory() === RESOURCE_CATEGORY.Npm),
      mode: computed(() => getMergeMeta('engine.config')?.dslMode !== 'Vue'),
      isInstance: false,
      title: computed(() => {
        const action = getActionType() === ACTION_TYPE.Edit ? '编辑' : '添加'
        const type = getType() === RESOURCE_TYPE.Bridge ? '桥接源' : '工具类'

        return action + type
      }),
      type: RESOURCE_CATEGORY.Npm
    })

    const codePreview = computed(() => {
      const name = state.name || 'name'
      let importName = name
      if (state.content.destructuring) {
        if (state.name && state.name === state.content.exportName) {
          importName = `{ ${state.content.exportName || 'exportName'} }`
        } else {
          importName = `{ ${state.content.exportName || 'exportName'} as ${name} }`
        }
      }

      const importFrom = `${state.content.package || 'package'}${state.content.main || ''}`
      return `import ${importName} from '${importFrom}'\nexport { ${name} }`
    })

    watchEffect(() => {
      state.name = state.resource.name
      state.content = state.resource.content || {}
      state.value = state.resource?.content?.value || ''
      state.type = getCategory()
    })

    watch(
      () => state.isInstance,
      (value) => {
        if (!value) {
          state.content.instance = ''
        }
      }
    )

    const editor = ref(null)
    const resourceForm = ref(null)

    onMounted(() => window.dispatchEvent(new Event('resize')))

    const save = () => {
      const data = {
        category: getType(),
        type: getCategory(),
        name: state.name,
        app: getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id,
        content: state.category
          ? state.content
          : {
              type: 'JSFunction',
              value: editor.value.getEditor().getValue()
            }
      }

      resourceForm.value.validate((valid) => {
        if (!valid) {
          return
        }

        if (!state.category && !editor.value.getEditor().getValue()) {
          useNotify({
            type: 'error',
            message: 'function 内容必填'
          })

          return
        }

        saveResource(data, closePanel, emit)
      })
    }

    const deleteReSource = () => {
      confirm({
        title: '删除资源',
        message: '如果删除正在使用的资源，将无法正常预览页面，确认要删除吗？',
        exec: () => {
          deleteData(state.name, closePanel, emit)
        }
      })
    }

    const rules = {
      name: [
        { required: true, message: '必填', trigger: 'change' },
        {
          validator: (rule, value, callback) => {
            const names = getResourceNamesByType(getType())

            if (Array.isArray(names) && names.includes(value)) {
              callback(new Error('资源名称已存在'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ],
      'content.package': [{ required: true, message: '必填', trigger: 'change' }],
      'content.exportName': [{ required: true, message: '必填', trigger: 'change' }],
      'content.instanceName': { required: true, message: '必填', trigger: 'change' }
    }

    const handleChangeType = (value) => {
      setCategory(value)
    }

    return {
      rules,
      resourceForm,
      editor,
      state,
      codePreview,
      isOpen,
      closePanel,
      save,
      deleteReSource,
      options: monacoOptions,
      handleChangeType,
      RESOURCE_CATEGORY
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-setting {
  :deep(.icon-wrap) {
    margin-right: 8px;
  }
  .resource-form {
    .tip {
      font-size: 11px;
      line-height: 18px;
      margin-top: 8px;
      color: var(--te-bridge-setting-tip-text-color);
    }
    :deep(.tiny-form-item__label) {
      .cdn-tips-icon {
        margin-left: 4px;
      }
    }
  }

  .title-wrap {
    font-size: 12px;
    font-weight: 700;
    color: var(--te-bridge-setting-title-text-color);
    .help-link {
      display: inline-block;
      color: var(--te-bridge-setting-link-text-color);
      font-size: 12px;
      margin-left: 16px;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .header-wrap {
    display: flex;
    align-items: center;
    column-gap: 6px;
    .tiny-button {
      width: 40px;
      padding: 0;
      min-width: 40px;
      margin-right: 2px;
    }
  }

  .monaco-editor {
    height: 500px;
    margin-top: 8px;
    border: 1px solid var(--te-bridge-editor-border-color);
  }
  .cdn-label-wrap {
    display: flex;
    align-items: center;
  }
}

.code-preview {
  font-size: 12px;
  line-height: 20px;
  background: var(--te-bridge-setting-code-bg-color);
  color: var(--te-bridge-setting-code-text-color);
  border-radius: 4px;

  & .pre-title {
    font-family: Microsoft YaHei;
  }

  & > pre {
    margin: 0;
    padding: 8px 20px;
    font-family: Consolas, 'Courier New', monospace;
  }
}
</style>
