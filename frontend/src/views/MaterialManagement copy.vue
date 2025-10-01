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
        <tiny-select 
          v-model="selectedComponent" 
          placeholder="请选择组件名称" 
          style="margin-right: 8px;"
          :options="componentOptions"
        ></tiny-select>
        <tiny-search 
          v-model="searchValue" 
          placeholder="请输入关键字搜索" 
          style="flex: 1;" 
          clearable
        ></tiny-search>
      </div>

      <!-- 物料表格 -->
      <MaterialTable 
        :table-data="materialData" 
        @edit-prop="editProp" 
        @delete-prop="deleteProp"
        @delete-material="deleteMaterial" 
        ref="materialTableRef" 
      />
    </div>

    <!-- 统一导入模态框（整合三种导入表单） -->
    <tiny-modal
      v-model="modalVisible"
      :title="modalTitle"
      :width="600"
      @cancel="handleModalCancel"
      show-footer
    >
      <!-- 表单容器：基于官方示例的tiny-form -->
      <tiny-form 
        ref="importFormRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="120px"
        label-position="top"
      >
        <!-- URL导入表单 -->
        <template v-if="activeModal === 'url'">
          <tiny-form-item label="URL地址" prop="url">
            <tiny-input 
              v-model="formData.url" 
              placeholder="请输入URL（如https://element-plus.org/zh-CN/component/breadcrumb）" 
              clearable
            />
          </tiny-form-item>
          <tiny-form-item label="组件API表格选择器" prop="apiTableSelector">
            <tiny-input 
              v-model="formData.apiTableSelector" 
              placeholder="请输入选择器（如.vp-table）" 
              clearable
            />
          </tiny-form-item>
        </template>

        <!-- NPM导入表单 -->
        <template v-else-if="activeModal === 'npm'">
          <tiny-form-item label="NPM包名" prop="packageName">
            <tiny-input 
              v-model="formData.packageName" 
              placeholder="请输入NPM包名（如element-plus）" 
              clearable
            />
          </tiny-form-item>
          <tiny-form-item label="组件名称" prop="componentName">
            <tiny-input 
              v-model="formData.componentName" 
              placeholder="请输入组件名称（如Affix）" 
              clearable
            />
          </tiny-form-item>
        </template>

        <!-- 源码导入表单 -->
        <template v-else-if="activeModal === 'source'">
          <tiny-form-item label="源码文件" prop="sourceFile">
            <tiny-file-upload 
              :data="uploadRequestData" 
              ref="uploadRef" 
              :action="uploadAction"
              :file-list="fileList"
              @change="handleFileChange"
            >
              <template #trigger>
                <tiny-button>选择源码文件</tiny-button>
              </template>
            </tiny-file-upload>
          </tiny-form-item>
        </template>
      </tiny-form>

      <!-- 导入进度显示 -->
      <template v-if="isImporting">
        <div class="import-progress">
          <p>{{ progressText }}</p>
          <tiny-progress
            :percentage="importProgress"
            status="active"
            style="margin-top: 16px;"
          />
        </div>
      </template>

      <!-- 导入结果显示 -->
      <template v-if="showResultTable">
        <div class="import-result">
          <h4 style="margin-bottom: 16px;">导入成功</h4>
          <tiny-grid :data="importResult">
            <tiny-grid-column field="name" title="物料名称"></tiny-grid-column>
            <tiny-grid-column field="type" title="导入类型"></tiny-grid-column>
            <tiny-grid-column field="importTime" title="导入时间"></tiny-grid-column>
          </tiny-grid>
        </div>
      </template>

      <template #footer>
      <tiny-button @click="handleModalCancel">取消</tiny-button>
      <tiny-button 
        type="primary" 
        @click="confirmImport"
        :disabled="isImporting || showResultTable"
      >
        确定
      </tiny-button>
    </template>
    </tiny-modal>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
// 1. 导入Tiny组件（按官方示例规范导入）
import { 
  TinyCard, 
  TinyButton, 
  TinySelect, 
  TinySearch,
  TinyModal,
  TinyForm,
  TinyFormItem,
  TinyInput,
  TinyFileUpload,
  TinyProgress,
  TinyGrid,
  TinyGridColumn,
  TinyNotify
} from '@opentiny/vue';
// 2. 导入自定义组件
import MaterialTable from '@/components/MaterialTable.vue';

// 3. 基础状态管理
// 组件选择器配置
const componentOptions = ref([
  { value: 'all', label: '全部组件' },
  { value: 'button', label: 'Button 按钮' },
  { value: 'checkbox', label: 'Checkbox 多选框' },
  { value: 'datePicker', label: 'DatePicker 日期选择器' },
  { value: 'input', label: 'Input 输入框' }
]);
const selectedComponent = ref('all');
const searchValue = ref('');

// 4. 模态框相关状态（统一管理，避免多模态框冗余）
const modalVisible = ref(false);        // 模态框显示状态
const activeModal = ref('');           // 当前激活的导入类型（url/npm/source）
const modalTitle = ref('');            // 模态框标题
const importFormRef = ref(null);       // 表单引用（用于验证）
const isImporting = ref(false);        // 导入中状态
const importProgress = ref(0);         // 导入进度
const progressText = ref('正在导入物料，请稍候...');
const showResultTable = ref(false);    // 结果显示状态
const importResult = ref([]);          // 导入结果数据

// 5. 表单数据和验证规则（按官方示例配置）
const formData = reactive({
  // URL导入字段
  url: '',
  apiTableSelector: '',
  // NPM导入字段
  packageName: '',
  componentName: '',
  // 源码导入字段
  sourceFile: null
});

// 表单验证规则（内置验证，无需自定义函数传递）
const formRules = ref({
  // URL导入验证规则
  url: [
    { required: true, message: '请输入有效的URL地址', trigger: ['blur', 'change'] },
    { pattern: /^https?:\/\/.+/, message: 'URL格式不正确，需要以http(s)://开头', trigger: ['blur', 'change'] }
  ],
  apiTableSelector: [
    { required: true, message: '请填写组件API表格选择器', trigger: ['blur', 'change'] }
  ],
  // NPM导入验证规则
  packageName: [
    { required: true, message: '请输入NPM包名', trigger: ['blur', 'change'] }
  ],
  componentName: [
    { required: true, message: '请输入组件名称', trigger: ['blur', 'change'] }
  ],
  // 源码导入验证规则
  sourceFile: [
    { required: true, message: '请选择并上传源码文件', trigger: ['change'] }
  ]
});

// 6. 源码上传相关配置
const uploadAction = ref('http://localhost:3001/api/upload');
const uploadRequestData = ref({});
const uploadRef = ref(null);
const fileList = ref([]);

// 7. 物料表格相关
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

// 8. 核心方法
/**
 * 打开导入模态框
 * @param type 导入类型（url/npm/source）
 */
const openModal = (type) => {
  // 重置状态
  activeModal.value = type;
  showResultTable.value = false;
  isImporting.value = false;
  importProgress.value = 0;
  
  // 设置模态框标题
  if (type === 'url') modalTitle.value = '通过URL导入';
  if (type === 'npm') modalTitle.value = '通过NPM导入';
  if (type === 'source') modalTitle.value = '通过源码导入';
  
  // 重置表单数据和验证状态
  Object.keys(formData).forEach(key => {
    if (key === 'sourceFile') formData[key] = null;
    else formData[key] = '';
  });
  fileList.value = [];
  
  // 显示模态框
  modalVisible.value = true;
  
  // 确保表单验证状态重置（等待DOM更新）
  nextTick(() => {
    importFormRef.value?.clearValidate();
  });
};

/**
 * 关闭模态框
 */
const handleModalCancel = () => {
  modalVisible.value = false;
  // 重置表单
  nextTick(() => {
    importFormRef.value?.resetFields();
  });
};

/**
 * 处理文件上传变化（源码导入）
 */
const handleFileChange = (file) => {
  if (file.status === 'success') {
    fileList.value = [file];
    formData.sourceFile = file; // 绑定到表单数据，用于验证
    TinyNotify({
      type: 'success',
      message: '文件上传成功',
      position: 'top-right'
    });
  } else if (file.status === 'error') {
    TinyNotify({
      type: 'error',
      message: '文件上传失败，请重试',
      position: 'top-right'
    });
  }
};

/**
 * 确认导入（核心逻辑）
 */
const confirmImport = async () => {
  // 1. 表单验证（使用TinyForm内置验证）
  try {
    await importFormRef.value.validate(); // 验证通过继续，失败则抛出错误
  } catch (error) {
    console.log('表单验证失败：', error);
    return; // 验证失败终止流程
  }

  // 2. 验证通过，开始模拟导入
  isImporting.value = true;
  importProgress.value = 0;
  progressText.value = '正在导入物料，请稍候...';

  // 模拟进度更新（实际项目替换为后端接口请求）
  await new Promise(resolve => setTimeout(resolve, 100));
  const timer = setInterval(() => {
    importProgress.value += 10;
    if (importProgress.value >= 100) {
      clearInterval(timer);
      isImporting.value = false;
      showResultTable.value = true;

      // 构造导入结果
      const importTypeMap = {
        url: 'URL导入',
        npm: 'NPM导入',
        source: '源码导入'
      };
      const importType = importTypeMap[activeModal.value] || '未知导入';
      const newMaterial = {
        name: `${importType}组件`,
        type: importType,
        importTime: new Date().toLocaleString()
      };
      importResult.value = [newMaterial];

      // 添加到物料库
      handleImportSuccess([newMaterial]);

      // 提示成功
      TinyNotify({
        type: 'success',
        message: '导入成功！',
        position: 'top-right'
      });
    }
  }, 300);
};

/**
 * 导入成功回调：添加到物料库
 */
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
  TinyNotify({ type: 'info', message: '物料导出成功', position: 'top-right' });
};

const deleteMaterials = () => {
  // 假设 MaterialTable 暴露了 getSelectedRows 方法
  const selectedRows = materialTableRef.value?.getSelectedRows() || [];
  if (selectedRows.length > 0) {
    materialData.value = materialData.value.filter(
      item => !selectedRows.some(row => row.id === item.id)
    );
    TinyNotify({ type: 'success', message: `已删除${selectedRows.length}个物料`, position: 'top-right' });
  } else {
    TinyNotify({ type: 'warning', message: '未选中任何物料', position: 'top-right' });
  }
};

// 物料操作方法
const deleteMaterial = (row) => {
  console.log('删除物料：', row);
  materialData.value = materialData.value.filter(item => item.id !== row.id);
  TinyNotify({ type: 'success', message: '物料删除成功', position: 'top-right' });
};

const editProp = (row, propRow) => {
  console.log('编辑属性：', row, propRow);
  TinyNotify({ type: 'info', message: `正在编辑属性 ${propRow.propName}`, position: 'top-right' });
  // 实际项目可打开编辑弹窗
};

const deleteProp = (row, propRow) => {
  console.log('删除属性：', row, propRow);
  row.propsData = row.propsData.filter(item => item.propName !== propRow.propName);
  TinyNotify({ type: 'success', message: `属性 ${propRow.propName} 删除成功`, position: 'top-right' });
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
