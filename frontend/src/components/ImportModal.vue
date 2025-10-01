<template>
  <div>
    <!-- 循环渲染所有导入任务的进度卡片（每个任务独立显示） -->
    <tiny-card v-for="(task, index) in filteredVisibleTasks" :key="task.id" type="text" class="card"
      :style="{ marginTop: `${96 * index}px` }">
      <!-- 任务卡片内容：显示当前任务的进度文本和按钮 -->
      <div class="card-top-row">
        <p class="card-text">{{ task.progressText }}</p>
        <div class="card-buttons">
          <tiny-button type="text" @click="openModalFromCard(task.id)">详情</tiny-button>
          <tiny-button type="text" @click="cancelTask(task.id)">取消</tiny-button>
        </div>
      </div>
      <tiny-progress :percentage="task.importProgress" color="#00b42a"
        style="margin-top: 8px; width: 100%;"></tiny-progress>
    </tiny-card>

    <tiny-modal :model-value="props.visible" ref="modalRef" :title="activeTask?.modalTitle || modalTitle" height="auto"
      width="880" @update:model-value="handleModelUpdate" show-footer @close="cancelActiveTask">
      <div class="modal-content-container" :key="activeTaskId">
        <!-- 1. 表单：仅当前任务未提交时显示 -->
        <template v-if="activeTask && !activeTask.isSubmitting">
          <tiny-form ref="importFormRef" :model="activeTask.formData" :rules="formRules" label-width="120px"
            label-position="top">
            <!-- URL导入表单 -->
            <template v-if="activeTask.activeModal === 'url'">
              <tiny-form-item label="URL地址" prop="url">
                <tiny-input v-model="activeTask.formData.url"
                  placeholder="请输入URL（如https://element-plus.org/zh-CN/component/breadcrumb）" clearable />
              </tiny-form-item>
              <tiny-form-item label="组件API表格选择器" prop="apiTableSelector">
                <tiny-input v-model="activeTask.formData.apiTableSelector" placeholder="请输入选择器（如.vp-table）" clearable />
              </tiny-form-item>
            </template>

            <!-- NPM导入表单 -->
            <template v-else-if="activeTask.activeModal === 'npm'">
              <tiny-form-item label="NPM包名" prop="packageName">
                <tiny-input v-model="activeTask.formData.packageName" placeholder="请输入NPM包名（如element-plus）" clearable />
              </tiny-form-item>
              <tiny-form-item label="组件名称" prop="componentName">
                <tiny-input v-model="activeTask.formData.componentName" placeholder="请输入组件名称（如Affix）" clearable />
              </tiny-form-item>
            </template>

            <!-- 源码导入表单 -->
            <template v-else-if="activeTask.activeModal === 'source'">
              <tiny-form-item label="源码文件" prop="sourceFile">
                <tiny-file-upload :data="uploadRequestData" ref="uploadRef" :action="uploadAction"
                  :file-list="activeTask.fileList" @change="(file) => handleFileChange(file, activeTask.id)">
                  <template #trigger>
                    <tiny-button>选择源码文件</tiny-button>
                  </template>
                </tiny-file-upload>
              </tiny-form-item>
            </template>
          </tiny-form>
        </template>

        <!-- 2. 提交后区域：显示当前活跃任务的进度/结果 -->
        <template v-if="activeTask && activeTask.isSubmitting">
          <!-- 进度条：当前任务导入中显示 -->
          <div class="import-progress" v-if="activeTask.isImporting">
            <div class="progress-container">
              <p class="progress-text">{{ activeTask.progressText }}</p>
              <tiny-progress :percentage="activeTask.importProgress" :stroke-width="12" color="#1890ff"
                style="flex: 1; margin-left: 16px;"></tiny-progress>
            </div>
          </div>

          <!-- 成功提示：当前任务导入完成显示 -->
          <div class="success-tip" v-if="activeTask.showSuccessTip">
            <img src="@/assets/success.svg" alt="成功图标" class="success-icon">
            <span>物料导入成功。</span>
          </div>

          <!-- 结果表格：当前任务导入完成显示 -->
          <template v-if="activeTask.showResultTable">
            <div class="import-result">
              <MaterialTable :table-data="activeTask.mockMaterialData"
                @delete-material="(row) => handleDeleteMaterial(row, activeTask.id)" :table-max-height="460"
                @edit-prop="(row, propRow) => handleEditProp(row, propRow, activeTask.id)"
                @delete-prop="(row, propRow) => handleDeleteProp(row, propRow, activeTask.id)" />
            </div>
          </template>
        </template>
      </div>

      <!-- 底部按钮组：根据当前活跃任务状态切换 -->
      <template #footer>
        <template v-if="activeTask">
          <!-- 1. 未提交：取消 + 确认（发起当前任务） -->
          <template v-if="!activeTask.isSubmitting">
            <tiny-button @click="cancelActiveTask">取消</tiny-button>
            <tiny-button type="primary" @click="confirmImport"
              :disabled="activeTask.isImporting || activeTask.showResultTable">
              确定
            </tiny-button>
          </template>

          <!-- 2. 已提交：根据当前任务状态切换 -->
          <template v-else>
            <!-- 2.1 导入中：取消 + 最小化（当前任务） -->
            <template v-if="activeTask.isImporting">
              <tiny-button @click="cancelActiveTask">取消</tiny-button>
              <tiny-button type="primary" @click="minimizeActiveTask">最小化</tiny-button>
            </template>

            <!-- 2.2 导入完成：取消 + 保存（当前任务） -->
            <template v-else-if="activeTask.showResultTable">
              <tiny-button @click="cancelActiveTask">取消</tiny-button>
              <tiny-button type="primary" @click="saveActiveTask">保存</tiny-button>
            </template>
          </template>
        </template>
      </template>
    </tiny-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch } from 'vue';
import {
  TinyModal, TinyButton, TinyForm, TinyFormItem, TinyInput,
  TinyFileUpload, TinyProgress, TinyNotify, TinyCard
} from '@opentiny/vue';
import MaterialTable from '@/components/MaterialTable.vue';

const modalRef = ref(null);
const importFormRef = ref(null);

// --------------- 多任务核心状态 ---------------
// 1. 所有导入任务数组（每个任务独立状态）
const tasks = ref([]);
// 2. 当前模态框活跃的任务ID（区分不同任务）
const activeTaskId = ref(null);
// 关键：计算属性必须在tasks之后定义，且正确访问tasks.value
const filteredVisibleTasks = computed(() => {
  const visibleTasks = tasks.value.filter(task => task.isCardVisible);
  // 打印可见任务，确认包含URL和NPM两个任务
  console.log('当前可见任务：', visibleTasks.map(t => ({ id: t.id, title: t.modalTitle })));
  return visibleTasks;
});
// 标记是否通过卡片详情打开模态框
const isOpeningFromCard = ref(false); // false=主动打开（新任务），true=详情打开（已有任务）

// 父组件属性
const props = defineProps({
  visible: Boolean,
  modalTitle: String,
  activeModal: String,
  materialData: Array
});

const emit = defineEmits(['update:visible', 'cancel', 'import-success']);

// 源码上传基础配置（共享）
const uploadAction = ref('http://localhost:3001/api/upload');
const uploadRequestData = ref({});

// --------------- 计算属性：获取当前活跃任务 ---------------
const activeTask = computed(() => {
  return tasks.value.find(task => task.id === activeTaskId.value) || null;
});

// --------------- 表单验证规则（共享） ---------------
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

// --------------- 任务操作：创建/取消/最小化/保存 ---------------
// 1. 创建新任务（打开模态框时初始化）
const createNewTask = () => {
  const taskId = Date.now().toString(); // 用时间戳作为唯一任务ID（后续可替换为后端任务ID）
  const newTask = {
    id: taskId,
    modalTitle: props.modalTitle, // 任务标题（如“通过NPM导入”）
    activeModal: props.activeModal, // 导入类型（url/npm/source）
    // 任务独立表单数据
    formData: {
      url: '',
      apiTableSelector: '',
      packageName: '',
      componentName: '',
      sourceFile: null
    },
    fileList: [], // 任务独立文件列表
    // 任务独立进度状态
    isSubmitting: false,
    isImporting: false,
    importProgress: 0,
    progressText: '物料正在导入中',
    showSuccessTip: false,
    showResultTable: false,
    isCardVisible: false, // 卡片是否显示
    timerId: null, // 任务独立定时器（避免干扰）
    // 任务独立结果数据
    mockMaterialData: [
      {
        id: `task-${taskId}-1`,
        name: `${props.activeModal === 'npm' ? 'NPM ' : props.activeModal === 'url' ? 'URL ' : '源码 '}Button 按钮`,
        importTime: new Date().toLocaleString(),
        propsData: [
          { propName: 'autofocus', propType: 'boolean', renderComponent: '下拉框', description: '是否默认聚焦' },
          { propName: 'circle', propType: 'boolean', renderComponent: '下拉框', description: '是否圆形按钮' },
          { propName: 'icon', propType: 'Component', renderComponent: '下拉框', description: '按钮左侧展示的图标' },
          { propName: 'text', propType: 'boolean', renderComponent: '输入框', description: '按钮显示的文本' },
          { propName: 'size', propType: 'string', renderComponent: '下拉框', description: '定义按钮尺寸' }
        ]
      },
      {
        id: `task-${taskId}-2`,
        name: `${props.activeModal === 'npm' ? 'NPM ' : props.activeModal === 'url' ? 'URL ' : '源码 '}Checkbox 多选框`,
        importTime: new Date().toLocaleString(),
        propsData: [
          { propName: 'check', propType: 'boolean', renderComponent: '下拉框', description: '是否默认选中' },
          { propName: 'indeterminate', propType: 'boolean', renderComponent: '下拉框', description: '是否半选状态' },
          { propName: 'label', propType: 'string', renderComponent: '输入框', description: '多选框标签文本' }
        ]
      }
    ]
  };
  tasks.value.push(newTask);
  // 打印新增后的任务数组，确认包含新任务（如NPM导入）
  console.log('新增任务后，所有任务：', tasks.value.map(t => ({ id: t.id, title: t.modalTitle })));
  activeTaskId.value = taskId; // 设为当前活跃任务
};

// 2. 确认导入（启动当前活跃任务）
const confirmImport = async () => {
  if (!activeTask.value) return;

  try {
    // 表单验证
    await importFormRef.value.validate();
    const task = activeTask.value;

    // 更新当前任务状态为“提交中”
    task.isSubmitting = true;
    task.isImporting = true;
    task.importProgress = 0;
    task.showSuccessTip = false;
    task.showResultTable = false;

    // 模拟进度定时器（独立绑定到当前任务）
    task.timerId = setInterval(() => {
      task.importProgress += 10;
      // 进度满100%：结束导入
      if (task.importProgress >= 100) {
        clearInterval(task.timerId);
        task.isImporting = false;
        task.showSuccessTip = true;
        task.showResultTable = true;
      }
    }, 300);
  } catch (error) {
    console.log('表单验证失败：', error);
  }
};

// 3. 最小化当前活跃任务（显示卡片，隐藏模态框）
const minimizeActiveTask = () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  task.isCardVisible = true; // 显示当前任务卡片
  modalRef.value.close(); // 关闭模态框
  emit('update:visible', false);
};

// 4. 从卡片打开模态框（恢复当前任务为活跃状态）
const openModalFromCard = async (taskId) => {
  // 关键1：打印传入的taskId和当前tasks数组，排查数据异常
  console.log('点击卡片的taskId：', taskId);
  console.log('当前所有任务：', tasks.value.map(t => ({ id: t.id, title: t.modalTitle })));

  // 关键2：严格查找当前taskId对应的任务（避免隐式类型转换）
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) {
    TinyNotify({ type: 'error', message: `未找到ID为${taskId}的任务`, position: 'top-right' });
    return;
  }

  // 关键3：确认找到的任务是当前点击的（如NPM导入），打印日志验证
  console.log('找到的任务：', { id: task.id, title: task.modalTitle, activeModal: task.activeModal });

  isOpeningFromCard.value = true;
  activeTaskId.value = taskId;

  // 关键4：强制触发响应式更新，确保activeTask立即切换
  tasks.value = [...tasks.value]; // 浅拷贝数组，触发计算属性重新执行
  await nextTick();

  // 先关闭模态框（避免旧内容残留），再打开
  if (modalRef.value) {
    modalRef.value.close();
    await nextTick(); // 等待关闭完成
  }

  // 隐藏卡片，打开模态框
  task.isCardVisible = false;
  emit('update:visible', true);
  modalRef.value?.open();

  // 日志确认最终activeTask是否正确
  console.log('最终activeTask：', { id: activeTask.value?.id, title: activeTask.value?.modalTitle });
};

// 5. 取消当前活跃任务（从任务数组移除，清除定时器）
const cancelActiveTask = () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  // 清除当前任务定时器
  if (task.timerId) clearInterval(task.timerId);
  // 从任务数组移除
  tasks.value = tasks.value.filter(t => t.id !== task.id);
  // 重置活跃任务ID
  activeTaskId.value = null;
  // 关闭模态框
  modalRef.value.close();
  emit('update:visible', false);
  emit('cancel');
};

// 6. 取消指定任务（卡片上的取消按钮）
const cancelTask = (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;

  // 清除定时器
  if (task.timerId) clearInterval(task.timerId);
  // 从任务数组移除
  tasks.value = tasks.value.filter(t => t.id !== taskId);
  // 若取消的是活跃任务，重置活跃状态
  if (taskId === activeTaskId.value) {
    activeTaskId.value = null;
    modalRef.value.close();
    emit('update:visible', false);
  }
};

// 7. 保存当前活跃任务结果（模拟）
const saveActiveTask = () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  // 1. 先通知父组件：用户确认保存，传递当前任务的结果数据
  emit('import-success', task.mockMaterialData);
  // 2. 显示保存成功提示
  TinyNotify({
    type: 'success',
    message: `【${task.modalTitle}】结果保存成功！`,
    position: 'top-right'
  });
  // 3. 保存后关闭模态框、移除任务（原有逻辑不变）
  cancelActiveTask();
};

// --------------- 辅助方法：文件上传/物料操作（绑定任务ID） ---------------
// 1. 文件上传（绑定当前任务的文件列表）
const handleFileChange = (file, taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;

  if (file.status === 'success') {
    task.fileList = [file];
    task.formData.sourceFile = file;
    TinyNotify({ type: 'success', message: '文件上传成功', position: 'top-right' });
  } else if (file.status === 'error') {
    TinyNotify({ type: 'error', message: '文件上传失败，请重试', position: 'top-right' });
  }
};

// 2. 删除物料（绑定当前任务的结果数据）
const handleDeleteMaterial = (row, taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;
  task.mockMaterialData = task.mockMaterialData.filter(item => item.id !== row.id);
};

// 3. 编辑属性（绑定当前任务）
const handleEditProp = (row, propRow, taskId) => {
  console.log(`编辑任务${taskId}的属性：`, row, propRow);
  // 实际编辑逻辑：修改当前任务的row.propsData
};

// 4. 删除属性（绑定当前任务）
const handleDeleteProp = (row, propRow, taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;
  row.propsData = row.propsData.filter(item => item.propName !== propRow.propName);
};

// --------------- 模态框生命周期：打开时创建新任务 ---------------
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // 关键：如果是通过卡片详情打开，不创建新任务，直接重置标记
    if (isOpeningFromCard.value) {
      isOpeningFromCard.value = false; // 重置标记，避免影响下次打开
      return;
    }

    // 仅当“主动打开模态框”时，才判断是否创建新任务（原有逻辑）
    const needCreateNewTask = !activeTask.value || activeTask.value.isSubmitting;
    if (needCreateNewTask) {
      createNewTask();
    }
  }
}, { immediate: true });

// 处理模态框内置关闭（仅关闭模态框，不删除任务）
const handleModelUpdate = (value) => {
  emit('update:visible', value);
  if (!value && activeTask.value) {
    // 关闭模态框时，若任务正在导入，自动最小化（显示卡片）
    if (activeTask.value.isImporting) {
      activeTask.value.isCardVisible = true;
    }
  }
};
</script>

<style scoped>
/* 任务卡片样式（每个卡片独立） */
.card {
  position: fixed;
  top: 20px;
  right: 24px;
  width: 320px;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
  border: none;
}

/* 卡片内部布局 */
.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-text {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.card-buttons {
  display: flex;
  gap: 12px;
}

/* 模态框内容容器 */
.modal-content-container {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
  margin-bottom: 16px;
  max-height: 600px;
}

/* 进度条区域 */
.import-progress {
  padding: 16px;
  background-color: #deecff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-text {
  margin: 0;
  font-size: 14px;
  white-space: nowrap;
}

/* 成功提示 */
.success-tip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #e6f2d5;
  border-radius: 4px;
  margin-bottom: 16px;
}

.success-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

/* 表单与表格样式 */
.import-result {
  padding: 0 16px;
}

:deep(.tiny-form-item) {
  margin-bottom: 16px;
}

:deep(.tiny-input),
:deep(.tiny-upload) {
  width: 100%;
}

:deep(.tiny-progress__text) {
  display: inline-block !important;
  margin-left: 8px;
}
</style>