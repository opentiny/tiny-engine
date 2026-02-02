<template>
  <div class="section">
    <tiny-button class="add-field-btn" size="mini" @click="$emit('add-field')"> <svg-icon name="add"></svg-icon> 添加字段 </tiny-button>
    <div class="field-table">
      <tiny-grid
        :data="model.parameters"
        :header-fixed="true"
        :scrollable="{ y: true }"
        :expand-config="expandConfig"
        ref="fieldGrid"
        style="height: 100%"
      >
        <tiny-grid-column type="index" width="60" title="序号"></tiny-grid-column>
        <tiny-grid-column type="expand" width="20">
          <template #default="{ row }">
            <div v-if="row.type === 'Enum'" class="expand-content">
              <div class="expand-section">
                <h4>默认选项（下拉框）</h4>
                <div class="enum-values">
                  <div v-for="(opt, index) in row.options || []" :key="index" class="enum-item">
                    <tiny-input
                      v-model="opt.value"
                      placeholder="值"
                      size="small"
                      style="width: 150px; margin-right: 8px"
                    />
                    <tiny-input
                      v-model="opt.label"
                      placeholder="显示标签"
                      size="small"
                      style="width: 200px; margin-right: 8px"
                    />
                    <tiny-button type="text" size="small" @click="$emit('insert-enum-after', row, index)"
                      >新增</tiny-button
                    >
                    <tiny-button type="text" size="small" @click="$emit('remove-enum', row, index)">删除</tiny-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="row.type === 'ModelRef'" class="expand-content">
              <div class="expand-section">
                <h4>引用的模型</h4>
                <div class="model-ref-section">
                  <tiny-select
                    v-model="row.defaultValue"
                    placeholder="请选择要引用的模型"
                    size="small"
                    style="width: 100%"
                  >
                    <tiny-option
                      v-for="model in relativeModels"
                      :key="model.id"
                      :value="model.id"
                      :label="`${model.nameCn} (${model.nameEn})`"
                    />
                  </tiny-select>
                  <div class="model-ref-info" v-if="row.defaultValue">
                    <p>已选择模型：{{ getModelName(row.defaultValue) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="prop" title="字段名称" width="120">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="editing-cell">
              <tiny-input v-model="row.prop" placeholder="请输入字段名称" size="small" />
            </div>
            <div v-else class="readonly-cell">{{ row.prop || '点击编辑' }}</div>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="type" title="类型" width="110">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="editing-cell">
              <tiny-select v-model="row.type" size="small" @change="handleTypeChange(row)">
                <tiny-option value="String" label="字符串" />
                <tiny-option value="Number" label="数字" />
                <tiny-option value="Boolean" label="布尔值" />
                <tiny-option value="Date" label="日期" />
                <tiny-option value="Enum" label="枚举值" />
                <tiny-option value="ModelRef" label="模型引用" />
              </tiny-select>
            </div>
            <div v-else class="readonly-cell">{{ getFieldTypeLabel(row.type) }}</div>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="defaultValue" title="默认值" width="120">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="editing-cell">
              <tiny-input v-model="row.defaultValue" placeholder="请输入默认值" size="small" />
            </div>
            <div v-else class="readonly-cell">{{ row.defaultValue }}</div>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="required" title="必填" width="60">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="editing-cell">
              <tiny-checkbox v-model="row.required" />
            </div>
            <div v-else class="readonly-cell"><tiny-checkbox v-model="row.required" disabled /></div>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="description" title="描述" width="120">
          <template #default="{ row }">
            <div v-if="row.isEditing" class="editing-cell">
              <tiny-input v-model="row.description" placeholder="请输入字段描述" size="small" />
            </div>
            <div v-else class="readonly-cell">{{ row.description || '点击编辑' }}</div>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="operation" title="操作" width="90">
          <template #default="{ row }">
            <div class="field-actions">
              <template v-if="row.isEditing">
                <span type="text" size="mini" @click="saveFieldEdit(row)">保存</span>
                <span type="text" size="mini" @click="cancelFieldEdit(row)">取消</span>
              </template>
              <template v-else>
                <span><svg-icon name="to-edit" @click.stop="startFieldEdit(row)" /></span>
                <span><svg-icon name="delete" @click.stop="handleDeleteField(row)" /></span>
              </template>
            </div>
          </template>
        </tiny-grid-column>
      </tiny-grid>
    </div>
  </div>
</template>

<script setup>
// 字段表格与展开编辑内容组件
// 仅承载表格与展开内容，具体列通过插槽从父组件传入，保证与现有逻辑一致
import { ref, computed, nextTick } from 'vue'
import { TinyButton, TinyGrid, TinyGridColumn, TinyInput, TinySelect, TinyOption, TinyCheckbox } from '@opentiny/vue'

const props = defineProps({
  model: { type: Object, required: true },
  expandConfig: { type: Object, required: true },
  availableModels: { type: Array, default: () => [] }
})

defineEmits(['insert-enum-after', 'remove-enum'])

const fieldGrid = ref(null)

const selectedModel = ref(props.model)

const relativeModels = computed(() => props.availableModels.filter((item) => item.id !== props.model.id))

// 父组件需要：
// 1) 读取 grid 数据以拿到 _RID
const getGridData = () => fieldGrid.value?.getData?.() || []

// 根据模型ID获取模型名称
const getModelName = (modelId) => {
  const model = relativeModels.value.find((m) => m.id === modelId)
  return model ? `${model.nameCn} (${model.nameEn})` : '未知模型'
}

// 字段类型变化处理
const handleTypeChange = (field) => {
  if (field.type === 'Enum' || field.type === 'ModelRef') {
    field.isExpanded = true
    // 初始化相应的数据结构
    if (field.type === 'Enum' && (!Array.isArray(field.options) || field.options.length === 0)) {
      field.options = [{ value: '', label: '' }]
    }
    // 模型引用类型：初始化模型引用
    if (field.type === 'ModelRef') {
      field.isModel = true
      field.defaultValue = field.defaultValue || null
    }
    // 将对应 _RID 推入展开 keys（去重）
    nextTick(() => {
      const gridData = fieldGrid.value?.getGridData?.() || []
      gridData.forEach((item) => {
        if (item.id === field.id && !expandConfig.value.expandRowKeys.includes(item._RID)) {
          expandConfig.value.expandRowKeys.push(item._RID)
        }
      })
    })
  } else {
    field.isExpanded = false
    // 按 _RID 从展开 keys 移除
    const gridData = fieldGrid.value?.getGridData?.() || []
    const current = gridData.find((item) => item.id === field.id)
    if (current) {
      const idx = expandConfig.value.expandRowKeys.indexOf(current._RID)
      if (idx > -1) expandConfig.value.expandRowKeys.splice(idx, 1)
    }
  }
  // 强制更新视图
  nextTick(() => {
    if (selectedModel.value && selectedModel.value.parameters) {
      selectedModel.value.parameters = [...selectedModel.value.parameters]
    }
  })
}

// 字段类型label转换
const getFieldTypeLabel = (type) => {
  const typeMap = {
    String: '字符串',
    Number: '数字',
    Boolean: '布尔值',
    Date: '日期',
    Enum: '枚举值',
    ModelRef: '模型引用'
  }
  return typeMap[type] || type
}

// 字段进入编辑状态
const startFieldEdit = (field) => {
  field._editCache = { ...field } // 缓存原始数据
  field.isEditing = true
  // 如果字段类型是枚举值或模型引用类型，自动展开
  if (field.type === 'Enum' || field.type === 'ModelRef') {
    field.isExpanded = true
    // 枚举类型：至少保证一条空数据
    if (field.type === 'Enum' && (!Array.isArray(field.options) || field.options.length === 0)) {
      field.options = [{ value: '', label: '' }]
    }
    // 模型引用类型：初始化模型引用
    if (field.type === 'ModelRef') {
      field.isModel = true
      field.defaultValue = field.defaultValue || null
    }
    // 添加到展开行keys（使用 _RID），并避免重复
    const gridData = fieldGrid.value?.getGridData() || []
    gridData.forEach((item) => {
      if (item.id === field.id && !expandConfig.value.expandRowKeys.includes(item._RID)) {
        expandConfig.value.expandRowKeys.push(item._RID)
      }
    })
  }
}
// 字段保存编辑
const saveFieldEdit = (field) => {
  field.isEditing = false
  field.isExpanded = false // 保存时收起展开行
  if (field._editCache && JSON.stringify(field._editCache) !== JSON.stringify(field)) {
    field._editCache = null
  }
  // 保存后移除 isNew 标记
  if (field.isNew) delete field.isNew
}

// 字段取消编辑
const cancelFieldEdit = (field) => {
  field.isEditing = false
  field.isExpanded = false // 取消时收起展开行
  // 从展开行keys中移除（使用 _RID）
  const gridData = fieldGrid.value?.getGridData?.() || []
  const current = gridData.find((item) => item.id === field.id)
  if (current) {
    const idx = expandConfig.value.expandRowKeys.indexOf(current._RID)
    if (idx > -1) expandConfig.value.expandRowKeys.splice(idx, 1)
  }
  // 取消编辑时，还原到缓存的数据
  if (field._editCache) {
    Object.assign(field, field._editCache)
    field._editCache = null
  }
  // 如果字段是新增的，则直接删除
  if (field.isNew) {
    const index = selectedModel.value.parameters.findIndex((f) => f.id === field.id)
    if (index > -1) selectedModel.value.parameters.splice(index, 1)
  }
}
// 删除字段
const handleDeleteField = (field) => {
  const index = selectedModel.value.parameters.findIndex((f) => f.prop === field.prop)
  if (index > -1) selectedModel.value.parameters.splice(index, 1)
}

defineExpose({
  fieldGrid,
  getGridData
})
</script>

<style lang="less" scoped>
.section {
  .add-field-btn {
    margin-bottom: 16px;
  }

  :deep(.tiny-grid-body__expanded-row) {
    background-color: var(--te-model-manage-input-bg-color);
  }
  .expand-section {
    margin-bottom: 16px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--te-model-manage-title-text-color);
      margin: 0 0 8px 0;
      padding-bottom: 1px;
    }

    .enum-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding: 8px;
      background-color: var(--te-model-manage-input-bg-color);
      border-radius: 4px;
    }

    .model-ref-section {
      margin-top: 8px;
    }

    .model-ref-info {
      margin-top: 8px;
      padding: 8px;
      background: #f0f8ff;
      border-radius: 4px;
      border: 1px solid #d6e4ff;

      p {
        margin: 0;
        font-size: 12px;
        color: #1890ff;
      }
    }
  }

  .editing-cell {
    :deep(.tiny-input),
    :deep(.tiny-select) {
      width: 100%;
    }
  }

  .readonly-cell {
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
    }
  }

  .field-actions,
  .editing-cell,
  .readonly-cell {
    background: transparent !important;
  }

  .field-actions {
    display: flex;
    gap: 8px;
    span {
      color: var(--te-common-text-emphasize);
    }
  }
}
</style>
