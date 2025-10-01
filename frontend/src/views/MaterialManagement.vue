<template>
  <div class="material-management">
    <!-- 导入方式卡片组 -->
    <div class="import-cards">
      <!-- URL导入 -->
      <tiny-card title="通过URL导入物料" custom-class="import-card">
        <p>输入URL地址获取API，根据API生成JSON</p>
        <tiny-button round @click="openModal('url')">导入</tiny-button>
      </tiny-card>

      <!-- NPM导入 -->
      <tiny-card title="通过NPM导入物料" custom-class="import-card">
        <p>获取NPM包内容后，根据NPM包内容生成JSON</p>
        <tiny-button round @click="openModal('npm')">导入</tiny-button>
      </tiny-card>

      <!-- 源码导入 -->
      <tiny-card title="通过源码导入物料" custom-class="import-card">
        <p>导入源码后通过AST分析，根据源码信息生成JSON</p>
        <tiny-button round @click="openModal('source')">导入</tiny-button>
      </tiny-card>
    </div>

    <!-- 物料库操作区 -->
    <div class="material-library">
      <h2>我的物料库</h2>
      <div class="library-buttons">
        <tiny-button round @click="exportMaterials">导出</tiny-button>
        <tiny-button round @click="deleteMaterials">删除</tiny-button>
      </div>
      <div class="library-select-search">
        <tiny-select v-model="selectedComponent" placeholder="请选择组件名称" style="margin-right: 8px;"
          :options="componentOptions"></tiny-select>
        <tiny-search v-model="searchValue" placeholder="请输入关键字搜索" style="flex: 1;" clearable></tiny-search>
      </div>

      <!-- 物料表格 -->
      <MaterialTable :table-data="materialData" :use-pagination="true" @edit-prop="editProp" @delete-prop="deleteProp"
        @delete-material="deleteMaterial" ref="materialTableRef" />
    </div>

    <!-- 引用封装的导入模态框组件 -->
    <ImportModal v-model:visible="modalVisible" :modal-title="modalTitle" :active-modal="activeModal"
      :material-data="materialData" @import-success="handleImportSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import {
  TinyCard,
  TinyButton,
  TinySelect,
  TinySearch
} from '@opentiny/vue';
import MaterialTable from '@/components/MaterialTable.vue';
import ImportModal from '@/components/ImportModal.vue'; // 导入封装的模态框组件

// 基础状态管理
const componentOptions = ref([
  { value: 'all', label: '全部组件' },
  { value: 'button', label: 'Button 按钮' },
  { value: 'checkbox', label: 'Checkbox 多选框' },
  { value: 'datePicker', label: 'DatePicker 日期选择器' },
  { value: 'input', label: 'Input 输入框' }
]);
const selectedComponent = ref('all');
const searchValue = ref('');

// 模态框相关状态
const modalVisible = ref(false);
const activeModal = ref('');
const modalTitle = ref('');


// 物料表格相关
const materialTableRef = ref(null);
const materialData = ref([
  {
    id: '1',
    name: 'Button 按钮',
    importTime: '2025-09-25 11:08',
    propsData: [
      { propName: 'autofocus', propType: 'boolean', renderComponent: '下拉框', description: '是否默认聚焦' },
      { propName: 'circle', propType: 'boolean', renderComponent: '下拉框', description: '是否圆形按钮' },
      { propName: 'icon', propType: 'Component', renderComponent: '下拉框', description: '按钮左侧展示的图标' },
      { propName: 'text', propType: 'boolean', renderComponent: '输入框', description: '按钮显示的文本' },
      { propName: 'size', propType: 'string', renderComponent: '下拉框', description: '定义按钮尺寸' }
    ]
  },
  {
    id: '2',
    name: 'Checkbox 多选框',
    importTime: '2025-09-25 11:08',
    propsData: [
      { propName: 'check', propType: 'boolean', renderComponent: '下拉框', description: '是否默认聚焦' },
      { propName: 'circle', propType: 'boolean', renderComponent: '下拉框', description: '是否圆形按钮' },
      { propName: 'icon', propType: 'Component', renderComponent: '下拉框', description: '按钮左侧展示的图标' },
      { propName: 'text', propType: 'boolean', renderComponent: '输入框', description: '按钮显示的文本' },
      { propName: 'size', propType: 'string', renderComponent: '下拉框', description: '定义按钮尺寸' }
    ]
  },
  {
    id: '3',
    name: 'DatePicker 日期选择器',
    importTime: '2025-09-25 11:08',
    propsData: [
      { propName: 'input', propType: 'boolean', renderComponent: '下拉框', description: '是否默认聚焦' },
      { propName: 'circle', propType: 'boolean', renderComponent: '下拉框', description: '是否圆形按钮' },
      { propName: 'icon', propType: 'Component', renderComponent: '下拉框', description: '按钮左侧展示的图标' },
      { propName: 'text', propType: 'boolean', renderComponent: '输入框', description: '按钮显示的文本' },
      { propName: 'size', propType: 'string', renderComponent: '下拉框', description: '定义按钮尺寸' }
    ]
  }
]);

// 打开导入模态框
const openModal = (type) => {
  activeModal.value = type;
  if (type === 'url') modalTitle.value = '通过URL导入';
  if (type === 'npm') modalTitle.value = '通过NPM导入';
  if (type === 'source') modalTitle.value = '通过源码导入';
  modalVisible.value = true;
};

// 导入成功回调：添加到物料库
const handleImportSuccess = (newMaterials) => {
  newMaterials.forEach((material, index) => {
    const lastId = materialData.value.at(-1)?.id || 0;
    const newId = String(parseInt(lastId) + 1 + index);

    materialData.value.push({
      id: newId,
      name: material.name,
      importTime: material.importTime,
      propsData: [
        { propName: 'name', propType: 'string', renderComponent: '输入框', description: '物料名称' },
        { propName: 'importType', propType: 'string', renderComponent: '下拉框', description: '导入类型' },
        { propName: 'version', propType: 'string', renderComponent: '输入框', description: '版本号' }
      ]
    });
  });
};

// 其他操作方法
const exportMaterials = () => {
  console.log('导出物料');
  // 实际项目中添加导出逻辑
};

const deleteMaterials = () => {
  const selectedRows = materialTableRef.value?.getSelectedRows() || [];
  if (selectedRows.length > 0) {
    materialData.value = materialData.value.filter(
      item => !selectedRows.some(row => row.id === item.id)
    );
  } else {
    // 实际项目中添加提示逻辑
  }
};

// 物料操作方法
const deleteMaterial = (row) => {
  materialData.value = materialData.value.filter(item => item.id !== row.id);
};

const editProp = (row, propRow) => {
  // 实际项目中添加编辑属性逻辑
};

const deleteProp = (row, propRow) => {
  row.propsData = row.propsData.filter(item => item.propName !== propRow.propName);
};
</script>

<style scoped>
.material-management {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.import-cards {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.import-card {
  background-color: white;
  flex: 1;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.import-card p {
  margin: 16px 0;
  color: #666;
  line-height: 1.5;
}

.material-library {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.library-buttons {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.library-select-search {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

:deep(.tiny-select) {
  width: 300px;
}

:deep(.tiny-search) {
  flex: 1;
}

/* 导入进度和结果样式 */
.import-progress {
  padding: 16px;
  text-align: center;
  margin-top: 16px;
}

.import-result {
  padding: 16px 0;
  margin-top: 16px;
}

/* 表单样式调整 */
:deep(.tiny-form-item) {
  margin-bottom: 16px;
}

:deep(.tiny-input),
:deep(.tiny-upload) {
  width: 100%;
}
</style>
