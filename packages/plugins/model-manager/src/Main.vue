<template>
  <div class="model-manager-container">
    <!-- 左侧：模型管理 -->
    <div class="left-panel" :class="{ expanded: !selectedModel }">
      <div class="panel-header">
        <div class="search-section">
          <tiny-input
            v-model="searchKeyword"
            
            clearable
            placeholder="搜索模型" 
            @input="handleSearch"
          >
            <template  #suffix>
                <tiny-icon-search/>
            </template>
          </tiny-input>
        </div>
        <div class="action-section">
          <tiny-button 
            type="primary" 
            @click="handleAddModel"
            class="add-model-btn"
          >
            <template #icon>
              <icon-plus />
            </template>
            添加模型
          </tiny-button>
        </div>
      </div>
      
      <div class="model-list">
        <div
          v-for="model in filteredModels"
          :key="model.id"
          class="model-item"
          :class="{ active: selectedModel?.id === model.id }"
          @click="selectModel(model)"
        >
          <div class="model-info">
            <div class="model-name">{{ model.name }}</div>
            <div class="model-english-name">{{ model.englishName }}</div>
            <div class="model-desc">{{ model.description || '暂无描述' }}</div>
          </div>
          <div class="model-actions">
            <svg-icon name="delete" @click.stop="handleDeleteModel(model)"></svg-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：模型详情/编辑 -->
    <div v-if="selectedModel" class="right-panel">
      <div class="model-detail">
        <div class="panel-header">
          <h3>模型设置</h3>
          <div class="header-actions">
            <tiny-button 
              type="primary" 
              @click="saveModel"
              class="save-btn"
            >
              <template #icon>
                <icon-edit />
              </template>
              保存
            </tiny-button>
            <tiny-button 
              type="text" 
              @click="cancelEdit"
              class="close-btn"
            >
              <template #icon>
                <icon-close />
              </template>
              取消
            </tiny-button>
          </div>
        </div>
        
        <div class="detail-content">
          <!-- 基本设置 -->
          <div class="section">
            <h4 class="section-title">模型基本设置</h4>
            <div class="form-item">
              <label>中文名称：</label>
              <tiny-input
                v-model="selectedModel.name"
                placeholder="请输入模型中文名称"
              />
            </div>
            <div class="form-item">
              <label>英文名称：</label>
              <tiny-input
                v-model="selectedModel.englishName"
                placeholder="请输入模型英文名称"
              />
            </div>
            <div class="form-item">
              <label>版本号：</label>
              <tiny-input
                v-model="selectedModel.version"
                placeholder="1.0.0"
              />
            </div>
            <div class="form-item">
              <label>描述：</label>
              <tiny-input
                type="textarea"
                v-model="selectedModel.description"
                placeholder="请输入模型描述"
                :rows="3"
              />
            </div>
          </div>

          <!-- 字段管理 -->
          <div class="section">
            <div class="section-header">
              <h4 class="section-title">字段管理</h4>
              <tiny-button 
                type="primary" 
                size="small"
                @click="handleAddField"
                class="add-field-btn"
              >
                <template #icon>
                  <icon-plus />
                </template>
                添加字段
              </tiny-button>
            </div>
            
            <div class="field-table">    
              <tiny-grid 
                :data="selectedModel.fields" 
                height="300px"
                :header-fixed="true"
                :scrollable="{ y: true }"
              >
                <tiny-grid-column type="index" width="70" title="序号"></tiny-grid-column>
                <tiny-grid-column field="name" title="字段名称" width="130">
                  <template #default="{ row }">
                    <div v-if="row.isEditing" class="editing-cell">
                      <tiny-input
                        v-model="row.name"
                        placeholder="请输入字段名称"
                        size="small"
                        ref="nameInput"
                      />
                    </div>
                    <div v-else class="readonly-cell" @click="startFieldEdit(row)">
                      {{ row.name || '点击编辑' }}
                    </div>
                  </template>
                </tiny-grid-column>
                <tiny-grid-column field="type" title="字段类型"  width="110">
                  <template #default="{ row }">
                    <div v-if="row.isEditing" class="editing-cell">
                      <tiny-select
                        v-model="row.type"
                        size="small"
                      >
                        <tiny-option value="string" label="字符串"></tiny-option>
                        <tiny-option value="number" label="数字"></tiny-option>
                        <tiny-option value="boolean" label="布尔值"></tiny-option>
                        <tiny-option value="date" label="日期"></tiny-option>
                        <tiny-option value="object" label="对象"></tiny-option>
                      </tiny-select>
                    </div>
                    <div v-else class="readonly-cell">
                      {{ getFieldTypeLabel(row.type) }}
                    </div>
                  </template>
                </tiny-grid-column>
                <tiny-grid-column field="required" title="是否必填"  width="110">
                  <template #default="{ row }">
                    <div v-if="row.isEditing" class="editing-cell">
                      <tiny-checkbox v-model="row.required" />
                    </div>
                    <div v-else class="readonly-cell">
                      <tiny-checkbox v-model="row.required" disabled />
                    </div>
                  </template>
                </tiny-grid-column>
                <tiny-grid-column field="description" title="字段描述" width="200">
                  <template #default="{ row }">
                    <div v-if="row.isEditing" class="editing-cell">
                      <tiny-input
                        v-model="row.description"
                        placeholder="请输入字段描述"
                        size="small"
                      />
                    </div>
                    <div v-else class="readonly-cell" @click="startFieldEdit(row)">
                      {{ row.description || '点击编辑' }}
                    </div>
                  </template>
                </tiny-grid-column>
                <tiny-grid-column field="operation" title="操作" width="120">
                  <template #default="{ row }">
                    <div class="field-actions">
                      <template v-if="row.isEditing">
                        <tiny-button
                          type="primary"
                          size="small"
                          @click="saveFieldEdit(row)"
                        >保存</tiny-button>
                        <tiny-button
                          type="text"
                          size="small"
                          @click="cancelFieldEdit(row)"
                        >取消</tiny-button>
                      </template>
                      <template v-else>
                        
                        <span>
                            <svg-icon name="to-edit" @click.stop="startFieldEdit(row)"></svg-icon>
                        </span>
                        <span>
                            <svg-icon name="delete" @click.stop="handleDeleteField(row)"></svg-icon>
                        </span>
                      </template>
                    </div>
                  </template>
                </tiny-grid-column>
              </tiny-grid>
            </div>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  iconSearch,
  IconPlus,
  IconEdit,
  IconDelete,
  IconClose
} from '@opentiny/vue-icon'
import {
  TinyInput,
  TinyButton,
  TinyGrid,
  TinyGridColumn,
  TinySelect,
  TinyOption,
  TinyCheckbox
} from '@opentiny/vue'
import { getModelList, createModel, updateModel, deleteModel } from './composable/useModelManager'

const searchKeyword = ref('') // 搜索关键字
const selectedModel = ref(null) // 当前选中的模型

// 模型数据列表，包含模型及其字段
const models = ref([
  {
    id: 1,
    name: '用户模型',
    englishName: 'UserModel',
    description: '用户基本信息模型',
    fields: []
  },
  {
    id: 2,
    name: '产品模型',
    englishName: 'ProductModel',
    description: '产品信息模型',
    fields: [
      { id: 5, name: 'id', type: 'number', required: true, description: '产品ID' },
      { id: 6, name: 'name', type: 'string', required: true, description: '产品名称' },
      { id: 7, name: 'price', type: 'number', required: true, description: '产品价格' },
      { id: 8, name: 'category', type: 'string', required: false, description: '产品分类' }
    ]
  },
  {
    id: 3,
    name: '订单模型',
    englishName: 'OrderModel',
    description: '订单信息模型',
    fields: [
      { id: 9, name: 'id', type: 'number', required: true, description: '订单ID' },
      { id: 10, name: 'orderNo', type: 'string', required: true, description: '订单号' },
      { id: 11, name: 'userId', type: 'number', required: true, description: '用户ID' },
      { id: 12, name: 'totalAmount', type: 'number', required: true, description: '订单总金额' },
      { id: 13, name: 'status', type: 'string', required: true, description: '订单状态' },
      { id: 14, name: 'createTime', type: 'date', required: true, description: '创建时间' }
    ]
  }
])

// 根据搜索关键字过滤模型列表
const filteredModels = computed(() => {
  if (!searchKeyword.value) return models.value
  return models.value.filter(model => 
    model.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 搜索输入处理（实际过滤逻辑在filteredModels中）
const handleSearch = () => {}
// 选中模型
const selectModel = (model) => { selectedModel.value = model }
// 添加新模型
const handleAddModel = () => {
  selectedModel.value = {
    id: null,
    name: '',
    englishName: '',
    version: '',
    description: '',
    fields: []
  };
};

// 删除模型
const handleDeleteModel = async (model) => {
  try {
    await deleteModel(model.id)
    const index = models.value.findIndex(m => m.id === model.id)
    if (index > -1) {
      models.value.splice(index, 1)
      if (selectedModel.value?.id === model.id) selectedModel.value = null
    }
  } catch (error) {}
}
// 保存模型时一并保存version字段
const saveModel = async () => {
  if (!selectedModel.value || !selectedModel.value.name.trim()) return;
  if (selectedModel.value.id === null) {
    const newModel = { ...selectedModel.value, id: Date.now() };
    models.value.push(newModel);
  } else {
    const index = models.value.findIndex(m => m.id === selectedModel.value.id);
    if (index > -1) {
      models.value.splice(index, 1, selectedModel.value);
    }
  }
  selectedModel.value = null;
};
// 取消编辑
const cancelEdit = () => { selectedModel.value = null }
// 添加字段，自动进入编辑状态
const handleAddField = () => {
  if (!selectedModel.value) return
  const newField = {
    id: Date.now(),
    name: '',
    type: 'string',
    required: false,
    description: '',
    isEditing: true,
    isNew: true // 新增字段标记
  }
  selectedModel.value.fields.push(newField)
  setTimeout(() => {
    const nameInputs = document.querySelectorAll('.editing-cell .tiny-input')
    if (nameInputs.length > 0) nameInputs[nameInputs.length - 1].focus()
  }, 100)
}
// 字段进入编辑状态
const startFieldEdit = (field) => {
  field._editCache = { ...field } // 缓存原始数据
  field.isEditing = true
}
// 字段保存编辑
const saveFieldEdit = (field) => {
  field.isEditing = false
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
  // 取消编辑时，还原到缓存的数据
  if (field._editCache) {
    Object.assign(field, field._editCache)
    field._editCache = null
  }
  // 如果字段是新增的，则直接删除
  if (field.isNew) {
    const index = selectedModel.value.fields.findIndex(f => f.id === field.id)
    if (index > -1) selectedModel.value.fields.splice(index, 1)
  }
}
// 删除字段
const handleDeleteField = (field) => {
  const index = selectedModel.value.fields.findIndex(f => f.id === field.id)
  if (index > -1) selectedModel.value.fields.splice(index, 1)
}
// 字段类型label转换
const getFieldTypeLabel = (type) => {
  const typeMap = {
    string: '字符串',
    number: '数字',
    boolean: '布尔值',
    date: '日期',
    object: '对象'
  }
  return typeMap[type] || type
}
// 生命周期：页面加载时拉取模型列表
onMounted(async () => {
  try {
    console.log(123)
    const data = await getModelList({
        currentPage:1,
        pageSize:50
    })
    if (data && data.length > 0) models.value = data
  } catch (error) {}
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
.search-section :deep(.tiny-input) {
  border-radius: 8px;
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
  padding: 20px;
  overflow-y: auto;
}
.section {
  margin-bottom: 32px;
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
}
.field-table :deep(.tiny-grid .tiny-grid-header__column){
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
.editing-cell {
  padding: 2px;
}
.editing-cell :deep(.tiny-input), .editing-cell :deep(.tiny-select) {
  width: 100%;
}
.readonly-cell {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.readonly-cell:hover {
  background-color: #f5f5f5;
}
.add-model-btn, .add-field-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  font-weight: 500;
}
.editing-cell {
  padding: 2px;
}
.editing-cell :deep(.tiny-input), .editing-cell :deep(.tiny-select) {
  width: 100%;
}
.readonly-cell {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}
.readonly-cell:hover {
  background-color: #f5f5f5;
}
.add-model-btn:hover, .add-field-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.25);
}
.add-model-btn:active, .add-field-btn:active {
  transform: translateY(0);
  box-shadow: 0 3px 10px rgba(24, 144, 255, 0.2);
}
.icon {
  display: inline-flex;
  align-items: center;
  font-size: 18px;
  color: #666;
  margin-right: 4px;
  cursor: pointer;
  transition: color 0.2s;
}
.icon:hover {
  color: #1890ff;
}
.field-actions,
.editing-cell,
.readonly-cell {
  background: transparent !important;
}
:deep(.tiny-grid__body tr:hover) td {
  background: #f5f7fa !important;
}
</style> 