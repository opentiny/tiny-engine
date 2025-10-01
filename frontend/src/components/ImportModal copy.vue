<template>
  <tiny-modal 
    :model-value="visible" 
    ref="modalRef" 
    :title="modalTitle" 
    :width="600" 
    @update:model-value="handleModelUpdate" 
    show-footer
  >
    <!-- 1. 表单：仅在未提交时显示 -->
    <template v-if="!isSubmitting">
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
            <tiny-input v-model="formData.url" placeholder="请输入URL（如https://element-plus.org/zh-CN/component/breadcrumb）" clearable />
          </tiny-form-item>
          <tiny-form-item label="组件API表格选择器" prop="apiTableSelector">
            <tiny-input v-model="formData.apiTableSelector" placeholder="请输入选择器（如.vp-table）" clearable />
          </tiny-form-item>
        </template>

        <!-- NPM导入表单 -->
        <template v-else-if="activeModal === 'npm'">
          <tiny-form-item label="NPM包名" prop="packageName">
            <tiny-input v-model="formData.packageName" placeholder="请输入NPM包名（如element-plus）" clearable />
          </tiny-form-item>
          <tiny-form-item label="组件名称" prop="componentName">
            <tiny-input v-model="formData.componentName" placeholder="请输入组件名称（如Affix）" clearable />
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
    </template>

    <!-- 2. 提交后区域 -->
    <template v-else>
      <!-- 进度条：仅在导入中显示 -->
      <div class="import-progress" v-if="isImporting">
        <p>{{ progressText }}</p>
        <tiny-progress 
          :percentage="importProgress" 
          status="active"
          style="margin-top: 8px;" 
        />
      </div>

      <!-- 成功提示：导入完成后显示 -->
      <div class="success-tip" v-if="showSuccessTip">
        <img src="@/assets/success.svg" alt="成功图标" class="success-icon">
        <span>物料导入成功。</span>
      </div>

      <!-- 结果表格：成功提示下方显示 -->
      <template v-if="showResultTable">
        <div class="import-result">
          <h4 style="margin-bottom: 16px;">导入结果</h4>
          <tiny-grid :data="importResult">
            <tiny-grid-column field="name" title="物料名称"></tiny-grid-column>
            <tiny-grid-column field="type" title="导入类型"></tiny-grid-column>
            <tiny-grid-column field="importTime" title="导入时间"></tiny-grid-column>
          </tiny-grid>
        </div>
      </template>
    </template>

    <template #footer>
      <tiny-button @click="handleCancel">取消</tiny-button>
      <tiny-button 
        type="primary" 
        @click="confirmImport"
        :disabled="isImporting || showResultTable"
        v-if="!isSubmitting"
      >
        确定
      </tiny-button>
    </template>
  </tiny-modal>
</template>

<script setup>
import { ref, reactive, nextTick, watch } from 'vue';
import {
  TinyModal,
  TinyButton,
  TinyForm,
  TinyFormItem,
  TinyInput,
  TinyFileUpload,
  TinyProgress,
  TinyGrid,
  TinyGridColumn,
  TinyNotify
} from '@opentiny/vue';

const modalRef = ref(null);  

// 接收父组件传递的属性
const props = defineProps({
  visible: Boolean,
  modalTitle: String,
  activeModal: String,
  materialData: Array
});

const emit = defineEmits(['update:visible', 'cancel', 'import-success']);

// 表单数据和验证规则（不变）
const formData = reactive({
  url: '',
  apiTableSelector: '',
  packageName: '',
  componentName: '',
  sourceFile: null
});

const formRules = ref({
  url: [
    { required: true, message: '请输入有效的URL地址', trigger: ['blur', 'change'] },
    { pattern: /^https?:\/\/.+/, message: 'URL格式不正确，需要以http(s)://开头', trigger: ['blur', 'change'] }
  ],
  apiTableSelector: [
    { required: true, message: '请填写组件API表格选择器', trigger: ['blur', 'change'] }
  ],
  packageName: [
    { required: true, message: '请输入NPM包名', trigger: ['blur', 'change'] }
  ],
  componentName: [
    { required: true, message: '请输入组件名称', trigger: ['blur', 'change'] }
  ],
  sourceFile: [
    { required: true, message: '请选择并上传源码文件', trigger: ['change'] }
  ]
});

// 源码上传相关配置（不变）
const uploadAction = ref('http://localhost:3001/api/upload');
const uploadRequestData = ref({});
const uploadRef = ref(null);
const fileList = ref([]);

// 导入相关状态
const isImporting = ref(false);
const importProgress = ref(0);
const progressText = ref('正在导入物料，请稍候...');
const showResultTable = ref(false);
const importResult = ref([]);
const importFormRef = ref(null);
const isSubmitting = ref(false);
// 新增显示成功提示的状态
const showSuccessTip = ref(false);

// 重置所有状态
const resetAllState = () => {
  isImporting.value = false;
  importProgress.value = 0;
  showResultTable.value = false;
  importResult.value = [];
  isSubmitting.value = false;
  showSuccessTip.value = false; // 重置成功提示状态
  
  Object.keys(formData).forEach(key => {
    if (key === 'sourceFile') formData[key] = null;
    else formData[key] = '';
  });
  fileList.value = [];
  
  nextTick(() => {
    importFormRef.value?.clearValidate();
  });
};

// 处理模态框内置关闭（不变）
const handleModelUpdate = (value) => {
  emit('update:visible', value);
  if (!value) {
    nextTick(() => {
      resetAllState();
    });
  }
};

// 关闭模态框（不变）
const handleCancel = () => {
  console.log('取消导入');
  if (modalRef.value) {
    modalRef.value.close();
  }
  emit('update:visible', false);
  nextTick(() => {
    resetAllState();
  });
};

// 处理文件上传变化（不变）
const handleFileChange = (file) => {
  if (file.status === 'success') {
    fileList.value = [file];
    formData.sourceFile = file;
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

// 确认导入
const confirmImport = async () => {
  try {
    await importFormRef.value.validate();
    
    // 提交后：隐藏表单，显示进度条
    isSubmitting.value = true;
    isImporting.value = true;
    progressText.value = '正在导入物料，请稍候...';
    showSuccessTip.value = false; // 确保成功提示先隐藏

    // 模拟进度更新
    await new Promise(resolve => setTimeout(resolve, 100));
    const timer = setInterval(() => {
      importProgress.value += 10;
      if (importProgress.value >= 100) {
        clearInterval(timer);
        isImporting.value = false;
        showResultTable.value = true;
        showSuccessTip.value = true; // 显示成功提示

        // 构造导入结果
        const importTypeMap = {
          url: 'URL导入',
          npm: 'NPM导入',
          source: '源码导入'
        };
        const importType = importTypeMap[props.activeModal] || '未知导入';
        const newMaterial = {
          name: `${importType}组件`,
          type: importType,
          importTime: new Date().toLocaleString()
        };
        importResult.value = [newMaterial];

        emit('import-success', [newMaterial]);
        TinyNotify({
          type: 'success',
          message: '导入成功！',
          position: 'top-right'
        });
      }
    }, 300);
  } catch (error) {
    console.log('表单验证失败：', error);
    return;
  }
};

// 监听导入类型变化，重置状态（不变）
watch(() => props.activeModal, (newType) => {
  resetAllState();
});
</script>

<style scoped>
/* 进度条样式：确保与表格间距合理 */
.import-progress {
  padding: 16px;
  text-align: center;
  background-color: #f9fafb;  /* 浅背景色，突出进度条区域 */
  border-radius: 8px;
  margin-bottom: 16px;  /* 进度条与其他内容的间距 */
}

/* 成功提示样式 */
.success-tip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #e6f7ed; /* 成功绿色背景 */
  border-radius: 4px;
  margin-bottom: 16px;
}

.success-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

/* 结果表格样式：与进度条保持间距 */
.import-result {
  padding: 0 16px;  /* 与进度条左右内边距对齐 */
}

:deep(.tiny-form-item) {
  margin-bottom: 16px;
}

:deep(.tiny-input),
:deep(.tiny-upload) {
  width: 100%;
}

/* 进度条成功态样式优化（可选） */
:deep(.tiny-progress--success .tiny-progress__bar) {
  background-color: #96ce69;
}
</style>