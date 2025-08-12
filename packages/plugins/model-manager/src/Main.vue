<template>
  <div class="model-manager-container">
    <!-- 左侧：模型管理（组件化） -->
    <ModelList
      :models="filteredModels"
      :selectedModelId="selectedModel?.id"
      v-model:searchKeyword="searchKeyword"
      @add-model="handleAddModel"
      @select-model="selectModel"
      @delete-model="handleDeleteModel"
    />

    <!-- 右侧：模型详情/编辑 -->
    <div v-if="selectedModel" class="right-panel">
      <div class="model-detail">
        <div class="panel-header">
          <h3>模型设置</h3>
          <div class="header-actions">
            <tiny-button type="primary" @click="saveModel" class="save-btn">
              <template #icon>
                <icon-edit />
              </template>
              保存
            </tiny-button>
            <tiny-button type="text" @click="cancelEdit" class="close-btn">
              <template #icon>
                <icon-close />
              </template>
              取消
            </tiny-button>
          </div>
        </div>

        <div class="detail-content">
          <!-- 基本设置（组件化） -->
          <ModelBasicForm v-model:model="selectedModel" @update:model="selectedModel = $event" />

          <!-- 字段管理（组件化） -->
          <FieldManager
            ref="fieldManagerRef"
            :model="selectedModel"
            :expand-config="expandConfig"
            @add-field="handleAddField"
            @insert-enum-after="insertEnumValueAfter"
            @remove-enum="removeEnumValue"
          >
            <tiny-grid-column field="prop" title="字段名称" width="130">
              <template #default="{ row }">
                <div v-if="row.isEditing" class="editing-cell">
                  <tiny-input v-model="row.prop" placeholder="请输入字段名称" size="small" />
                </div>
                <div v-else class="readonly-cell">{{ row.prop || '点击编辑' }}</div>
              </template>
            </tiny-grid-column>
            <tiny-grid-column field="type" title="字段类型" width="100">
              <template #default="{ row }">
                <div v-if="row.isEditing" class="editing-cell">
                  <tiny-select v-model="row.type" size="small" @change="handleTypeChange(row)">
                    <tiny-option value="String" label="字符串" />
                    <tiny-option value="Number" label="数字" />
                    <tiny-option value="Boolean" label="布尔值" />
                    <tiny-option value="Date" label="日期" />
                    <tiny-option value="Enum" label="枚举值" />
                  </tiny-select>
                </div>
                <div v-else class="readonly-cell">{{ getFieldTypeLabel(row.type) }}</div>
              </template>
            </tiny-grid-column>
            <tiny-grid-column field="required" title="是否必填" width="110">
              <template #default="{ row }">
                <div v-if="row.isEditing" class="editing-cell">
                  <tiny-checkbox v-model="row.required" />
                </div>
                <div v-else class="readonly-cell"><tiny-checkbox v-model="row.required" disabled /></div>
              </template>
            </tiny-grid-column>
            <tiny-grid-column field="description" title="字段描述" width="120">
              <template #default="{ row }">
                <div v-if="row.isEditing" class="editing-cell">
                  <tiny-input v-model="row.description" placeholder="请输入字段描述" size="small" />
                </div>
                <div v-else class="readonly-cell">{{ row.description || '点击编辑' }}</div>
              </template>
            </tiny-grid-column>
            <tiny-grid-column field="operation" title="操作" width="150">
              <template #default="{ row }">
                <div class="field-actions">
                  <template v-if="row.isEditing">
                    <tiny-button type="primary" size="small" @click="saveFieldEdit(row)">保存</tiny-button>
                    <tiny-button type="text" size="small" @click="cancelFieldEdit(row)">取消</tiny-button>
                  </template>
                  <template v-else>
                    <span><svg-icon name="to-edit" @click.stop="startFieldEdit(row)" /></span>
                    <span><svg-icon name="delete" @click.stop="handleDeleteField(row)" /></span>
                  </template>
                </div>
              </template>
            </tiny-grid-column>
          </FieldManager>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import ModelList from './components/ModelList.vue'
import ModelBasicForm from './components/ModelBasicForm.vue'
import FieldManager from './components/FieldManager.vue'
import { IconEdit, IconClose } from '@opentiny/vue-icon'
import { TinyInput, TinyButton, TinyGridColumn, TinySelect, TinyOption, TinyCheckbox, Modal } from '@opentiny/vue'
import { _getModelLists as getModelList, createModel, updateModel, deleteModel } from './composable/useModelManager'

const searchKeyword = ref('') // 搜索关键字
const selectedModel = ref(null) // 当前选中的模型
const fieldManagerRef = ref(null)
// 模型数据列表，包含模型及其字段
const models = ref([
  {
    id: 1,
    nameCn: '用户模型',
    nameEn: 'UserModel',
    description: '用户基本信息模型',
    modelUrl: '',
    parameters: []
  },
  {
    id: 2,
    nameCn: '产品模型',
    nameEn: 'ProductModel',
    description: '产品信息模型',
    modelUrl: '',
    parameters: [
      { id: 5, prop: 'id', type: 'Number', required: true, description: '产品ID' },
      { id: 6, prop: 'name', type: 'String', required: true, description: '产品名称' },
      { id: 7, prop: 'price', type: 'Number', required: true, description: '产品价格' },
      { id: 8, prop: 'category', type: 'String', required: false, description: '产品分类' }
    ]
  },
  {
    id: 3,
    nameCn: '订单模型',
    nameEn: 'OrderModel',
    description: '订单信息模型',
    modelUrl: '',
    parameters: [
      { id: 9, prop: 'id', type: 'Number', required: true, description: '订单ID' },
      { id: 10, prop: 'orderNo', type: 'String', required: true, description: '订单号' },
      { id: 11, prop: 'userId', type: 'Number', required: true, description: '用户ID' },
      { id: 12, prop: 'totalAmount', type: 'Number', required: true, description: '订单总金额' },
      { id: 13, prop: 'status', type: 'String', required: true, description: '订单状态' },
      { id: 14, prop: 'createTime', type: 'Date', required: true, description: '创建时间' }
    ]
  }
])

// 根据搜索关键字过滤模型列表
const filteredModels = computed(() => {
  if (!searchKeyword.value) return models.value
  return models.value.filter(
    (model) =>
      (model.nameCn || '').toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (model.description || '').toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 展开行配置
const expandConfig = ref({
  expandAll: false,
  trigger: 'row',
  expandRowKeys: [],
  accordion: false,
  activeMethod: (row) => row.isEditing && row.type === 'Enum',
  showIcon: (row) => row.isEditing && row.type === 'Enum'
})

// 对象编辑器与 grid 的内部细节下沉到 FieldManager，通过暴露的方法访问

// 搜索输入由子组件处理
// 选中模型
const selectModel = (model) => {
  selectedModel.value = model
}
// 添加新模型
const handleAddModel = () => {
  selectedModel.value = {
    id: null,
    nameCn: '',
    nameEn: '',
    version: '',
    modelUrl: '',
    description: '',
    parameters: []
  }
}

// 删除模型（TinyVue 二次确认）
const handleDeleteModel = async (model) => {
  const name = model.nameCn || model.nameEn || model.id
  try {
    const result = await Modal.confirm({
      title: '提示',
      message: `确认删除模型「${name}」吗？该操作不可恢复。`
    })
    const confirmed = result === 'confirm' || result?.action === 'confirm' || result === true || result === undefined
    if (!confirmed) return
    await deleteModel(model.id)
    const index = models.value.findIndex((m) => m.id === model.id)
    if (index > -1) {
      models.value.splice(index, 1)
      if (selectedModel.value?.id === model.id) selectedModel.value = null
    }
  } catch (error) {
    // 用户取消或弹窗异常，不做处理
  }
}

const getModelLists = async () => {
  const data = await getModelList()
  if (data && data.records.length > 0) models.value = data.records
}

// 保存模型时一并保存version字段
const saveModel = async () => {
  if (!selectedModel.value || !selectedModel.value.nameCn?.trim()) return
  const newModel = { ...selectedModel.value }
  if (selectedModel.value.id === null) {
    await createModel(newModel)
    getModelLists()
  } else {
    await updateModel(newModel)
    getModelLists()
  }
  selectedModel.value = null
}
// 取消编辑
const cancelEdit = () => {
  selectedModel.value = null
}
// 添加字段，自动进入编辑状态
const handleAddField = () => {
  if (!selectedModel.value) return
  const newField = {
    id: Date.now(),
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
// 字段进入编辑状态
const startFieldEdit = (field) => {
  field._editCache = { ...field } // 缓存原始数据
  field.isEditing = true
  // 如果字段类型是枚举值，自动展开
  if (field.type === 'Enum') {
    field.isExpanded = true
    // 枚举类型：至少保证一条空数据
    if (!Array.isArray(field.defaultValue) || field.defaultValue.length === 0) {
      field.defaultValue = [{ value: '', label: '' }]
    }
    // 添加到展开行keys（使用 _RID），并避免重复
    const gridData = fieldManagerRef.value?.getGridData() || []
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
  // 从展开行keys中移除（使用 _RID）
  const gridData = fieldManagerRef.value?.getGridData?.() || []
  const current = gridData.find((item) => item.id === field.id)
  if (current) {
    const idx = expandConfig.value.expandRowKeys.indexOf(current._RID)
    if (idx > -1) expandConfig.value.expandRowKeys.splice(idx, 1)
  }
  if (field._editCache && JSON.stringify(field._editCache) !== JSON.stringify(field)) {
    // 模拟后端保存逻辑
    // 例如：updateModel(field.id, field)
    // 实际应用中，这里需要调用后端API
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
  const gridData = fieldManagerRef.value?.getGridData?.() || []
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
  const index = selectedModel.value.parameters.findIndex((f) => f.id === field.id)
  if (index > -1) selectedModel.value.parameters.splice(index, 1)
}
// 字段类型label转换
const getFieldTypeLabel = (type) => {
  const typeMap = {
    String: '字符串',
    Number: '数字',
    Boolean: '布尔值',
    Date: '日期',
    Enum: '枚举值'
  }
  return typeMap[type] || type
}
// 字段类型变化处理
const handleTypeChange = (field) => {
  if (field.type === 'Enum') {
    field.isExpanded = true
    // 初始化相应的数据结构
    if (!Array.isArray(field.defaultValue) || field.defaultValue.length === 0) {
      field.defaultValue = [{ value: '', label: '' }]
    }
    // 将对应 _RID 推入展开 keys（去重）
    nextTick(() => {
      const gridData = fieldManagerRef.value?.getGridData?.() || []
      gridData.forEach((item) => {
        if (item.id === field.id && !expandConfig.value.expandRowKeys.includes(item._RID)) {
          expandConfig.value.expandRowKeys.push(item._RID)
        }
      })
    })
  } else {
    field.isExpanded = false
    // 按 _RID 从展开 keys 移除
    const gridData = fieldManagerRef.value?.getGridData?.() || []
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

// 删除枚举值
const removeEnumValue = (field, index) => {
  if (!Array.isArray(field.defaultValue)) return
  if (field.defaultValue.length <= 1) {
    // 只剩一条时，不删除，清空内容
    field.defaultValue[0] = { value: '', label: '' }
    return
  }
  field.defaultValue.splice(index, 1)
}

// 在当前行后插入一条枚举值
const insertEnumValueAfter = (field, index) => {
  if (!field.defaultValue) {
    field.defaultValue = []
  }
  field.defaultValue.splice(index + 1, 0, { value: '', label: '' })
}

// 生命周期：页面加载时拉取模型列表
onMounted(async () => {
  await getModelLists()
})
</script>

<style scoped>
.model-manager-container {
  display: flex;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.left-panel {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  transition: width 0.3s ease;
}
.left-panel.expanded {
  width: 100%;
}
.right-panel {
  flex: 1;
  width: 850px;
  display: flex;
  flex-direction: column;
}
.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.search-section {
  flex: 1;
}
.search-section :deep(.tiny-input__inner) {
  border-radius: 8px;
  border: 1px solid #e1e5e9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  padding: 8px 12px;
}
.search-section :deep(.tiny-input__inner:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
  background: #ffffff;
}
.search-section :deep(.tiny-input__inner:hover) {
  border-color: #40a9ff;
}
.search-section :deep(.tiny-input_suffix) {
  color: #8c8c8c;
  display: flex;
  align-items: center;
  margin-right: 8px;
}
.action-section {
  flex-shrink: 0;
}
.model-list {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
.model-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 48px;
}
.model-item:last-child {
  border-bottom: none;
}
.model-item:hover {
  background: linear-gradient(90deg, #f8f9fa 0%, #f0f8ff 100%);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.model-item.active {
  background: linear-gradient(90deg, #e6f7ff 0%, #f0f8ff 100%);
  border-right: 3px solid #1890ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.15);
}
.model-info {
  flex: 1;
}
.model-name {
  font-weight: 600;
  color: #262626;
  margin-bottom: 2px;
  font-size: 14px;
  line-height: 1.2;
}
.model-english-name {
  font-size: 11px;
  color: #666666;
  margin-bottom: 4px;
  line-height: 1.2;
  font-family: monospace;
  font-weight: 400;
}
.model-desc {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.model-actions {
  display: flex;
  gap: 2px;
}
.model-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.save-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.25);
}
.close-btn {
  color: #8c8c8c;
  transition: color 0.2s ease;
}
.close-btn:hover {
  color: #262626;
}
.detail-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex; /* 让内部卡片可按列铺满 */
  flex-direction: column;
}
.section {
  margin-bottom: 16px;
  background: #ffffff;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.section:last-of-type {
  /* 让最后一个卡片（字段管理）自适应撑满到底部 */
  flex: 1;
  display: flex;
  flex-direction: column;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header .section-title {
  margin: 0;
  border-bottom: none;
  padding-bottom: 0;
}
.field-table {
  overflow: hidden;
  width: 100%;
  flex: 1; /* 让表格区域在卡片内自适应高度 */
  display: flex;
  flex-direction: column;
}
.field-table :deep(.tiny-grid) {
  flex: 1;
}
.field-table :deep(.tiny-grid .tiny-grid-header__column) {
  position: sticky;
  background: #ffffff;
}
.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #262626;
  font-size: 14px;
}
.field-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 100%;
  justify-content: left;
}

.editing-cell :deep(.tiny-input),
.editing-cell :deep(.tiny-select) {
  width: 100%;
}
.readonly-cell {
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.readonly-cell:hover {
  background-color: #f5f5f5;
}
.add-model-btn,
.add-field-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  font-weight: 500;
}
.add-model-btn:hover,
.add-field-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.25);
}
.add-model-btn:active,
.add-field-btn:active {
  transform: translateY(0);
  box-shadow: 0 3px 10px rgba(24, 144, 255, 0.2);
}
.field-actions,
.editing-cell,
.readonly-cell {
  background: transparent !important;
}

/* 展开行样式 */
.expand-content {
  padding: 8px 12px;
  background: #fafafa;
  border-top: 1px solid #eaeaea;
}

.expand-section {
  margin-bottom: 16px;
}

.expand-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0; /* 缩小标题与编辑器间距 */
  padding-bottom: 1px;
}

.property-item,
.enum-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.object-properties,
.enum-values {
  margin-top: 8px;
}

.object-properties .tiny-button,
.enum-values .tiny-button {
  margin-top: 8px;
}
:deep(.tiny-grid__body) {
  width: 98% !important;
}
.tiny-grid :deep(.tiny-grid-body__expanded-cell) {
  padding: 0 10px;
}
/* 行展开中的 JSON 编辑器尺寸与提示样式 */
.variable-editor {
  width: 100%;
  height: 260px; /* 进一步收紧高度 */
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
</style>
