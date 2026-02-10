<template>
  <plugin-setting
    v-if="isShow"
    :fixed-name="PLUGIN_NAME.ModelManager"
    :align="align"
    title="模型设置"
    class="modelmanager-plugin-setting"
  >
    <template #header>
      <button-group>
        <tiny-button v-if="showExport" @click="$emit('exportModel', selectedModel?.id)">导出SQL</tiny-button>
        <tiny-button type="primary" @click="saveModel">保存</tiny-button>
        <svg-button name="delete" v-if="selectedModel?.id" @click="deleteModel"></svg-button>
        <svg-button name="close" @click="closeModelSettingPanel"></svg-button>
      </button-group>
    </template>

    <template #content>
      <tiny-collapse v-model="activeName" class="page-setting-collapse">
        <tiny-collapse-item title="基本设置" name="general">
          <model-basic-form ref="modelBasicFormRef" :model="selectedModel"></model-basic-form>
        </tiny-collapse-item>

        <tiny-collapse-item class="base-setting" title="字段管理" name="fields">
          <field-manager
            ref="fieldManagerRef"
            :model="selectedModel"
            :expand-config="expandConfig"
            :available-models="models"
            @add-field="handleAddField"
            @insert-enum-after="insertEnumValueAfter"
            @remove-enum="removeEnumValue"
          >
          </field-manager>
        </tiny-collapse-item>
      </tiny-collapse>
    </template>
  </plugin-setting>
</template>
<script>
import { ref, watch, nextTick } from 'vue'
import { Button, Collapse, CollapseItem, Notify } from '@opentiny/vue'
import { PluginSetting, ButtonGroup, SvgButton } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import ModelBasicForm from './ModelBasicForm.vue'
import FieldManager from './FieldManager.vue'
import { createModel, updateModel } from '../composable/useModelManager'

const isShow = ref(false)

export const openModelSettingPanel = () => {
  isShow.value = true
}

export const closeModelSettingPanel = () => {
  isShow.value = false
}

export default {
  components: {
    PluginSetting,
    SvgButton,
    ButtonGroup,
    ModelBasicForm,
    FieldManager,
    TinyButton: Button,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem
  },
  props: {
    model: {
      type: Object,
      default: () => ({})
    },
    models: {
      type: Array,
      default: () => []
    },
    showExport: {
      type: Boolean,
      default: false
    }
  },
  emits: ['editCallback', 'exportModel', 'deleteCallback'],
  setup(props, { emit }) {
    const { PLUGIN_NAME } = useLayout()
    const activeName = ref(['general', 'fields'])
    const selectedModel = ref()
    const modelBasicFormRef = ref()
    // 展开行配置
    const expandConfig = ref({
      expandAll: false,
      trigger: 'row',
      expandRowKeys: [],
      accordion: false,
      activeMethod: (row) => row.type === 'Enum' || row.type === 'ModelRef', // 枚举类型和模型引用类型都显示展开箭头
      showIcon: (row) => row.type === 'Enum' || row.type === 'ModelRef' // 枚举类型和模型引用类型都显示展开箭头
    })

    // 添加字段，自动进入编辑状态
    const handleAddField = () => {
      if (!selectedModel.value) return
      const newField = {
        prop: '',
        type: 'String',
        required: false,
        description: '',
        isEditing: true,
        isNew: true // 新增字段标记
      }
      selectedModel.value.parameters.push(newField)
      nextTick(() => {
        const nameInputs = document.querySelectorAll('.editing-cell .tiny-input')
        if (nameInputs.length > 0) nameInputs[nameInputs.length - 1].focus()
      })
    }

    // 在当前行后插入一条枚举值
    const insertEnumValueAfter = (field, index) => {
      if (!field.options) {
        field.options = []
      }
      field.options.splice(index + 1, 0, { value: '', label: '' })
    }

    // 删除枚举值
    const removeEnumValue = (field, index) => {
      if (!Array.isArray(field.options)) return
      if (field.options.length <= 1) {
        // 只剩一条时，不删除，清空内容
        field.options[0] = { value: '', label: '' }
        return
      }
      field.options.splice(index, 1)
    }

    // 保存模型时一并保存version字段
    const saveModel = async () => {
      // 从子组件获取最新的数据
      const latestModelData = modelBasicFormRef.value?.getLocalValue()
      modelBasicFormRef.value.validate().then(async (valid) => {
        if (valid) {
          const newModel = {
            description: latestModelData.description,
            modelUrl: latestModelData.modelUrl,
            nameCn: latestModelData.nameCn,
            nameEn: latestModelData.nameEn,
            version: latestModelData.version,
            id: latestModelData.id,
            parameters: latestModelData.parameters.filter((item) => !!item.prop)
          }
          let isModelRefRelative = true
          let propertyName = ''
          if (newModel.parameters?.length > 0) {
            newModel.parameters.forEach((item) => {
              if (item.type === 'Enum') {
                item.options = JSON.stringify(item.options)
              }
              if (item.type === 'ModelRef') {
                item.isModel = true
                delete item.options
                item.defaultValue = item.defaultValue || null
                isModelRefRelative = !!item.defaultValue
                propertyName = item.prop
              }
            })
          }
          if (!isModelRefRelative) {
            Notify({
              type: 'error',
              message: `字段${propertyName}未关联模型引用`
            })
            return
          }
          if (latestModelData.id === null) {
            delete newModel.id
            await createModel(newModel)
          } else {
            await updateModel(newModel.id, newModel)
          }
          emit('editCallback')
          Notify({
            type: 'success',
            message: '保存成功'
          })
          selectedModel.value = null
        }
      })
    }

    const deleteModel = () => {
      $emit('deleteCallback', selectedModel)
      closeModelSettingPanel()
    }
    // 监听 props 变化，同步到本地（当选择不同模型时）
    watch(
      () => props.model,
      (newModel) => {
        selectedModel.value = newModel
      },
      { deep: true }
    )
    return {
      isShow,
      PLUGIN_NAME,
      activeName,
      modelBasicFormRef,
      expandConfig,
      selectedModel,
      closeModelSettingPanel,
      handleAddField,
      insertEnumValueAfter,
      removeEnumValue,
      saveModel,
      deleteModel
    }
  }
}
</script>
<style lang="less" scoped>
.modelmanager-plugin-setting {
  width: 578px;

  :deep(.tiny-collapse .tiny-collapse-item) {
    .tiny-collapse-item__header {
      padding: 0;
    }

    .tiny-collapse-item__wrap .tiny-collapse-item__content {
      padding: 0;
      .section {
        padding: 0;
      }
    }
  }
}
</style>
