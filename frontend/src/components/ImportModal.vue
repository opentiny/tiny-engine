<template>
  <div>
    <!-- 循环渲染所有导入任务的进度卡片（每个任务独立显示） -->
    <tiny-card v-for="(task, index) in filteredVisibleTasks" :key="task.id" type="text" class="card"
      :style="{ marginTop: `${96 * index}px` }">
      <div class="card-top-row">
        <p class="card-text">
          <!-- 任务进行中：固定显示“物料正在导入中...” -->
          <template v-if="task.isImporting">物料正在导入中...</template>
          <!-- 导入成功：固定显示“物料导入成功。” -->
          <template v-else-if="task.showSuccessTip">物料导入成功。</template>
          <!-- 其他状态（如失败）：保留原有进度文本（可选，避免文字空白） -->
          <template v-else>任务状态异常</template>
        </p>
        <div class="card-buttons">
          <tiny-button type="text" @click="openModalFromCard(task.id)">详情</tiny-button>
          <tiny-button type="text" @click="cancelTask(task.id)">取消</tiny-button>
        </div>
      </div>
      <tiny-progress :percentage="task.importProgress" color="#00b42a"
        style="margin-top: 8px; width: 100%;"></tiny-progress>
    </tiny-card>

    <tiny-modal :model-value="props.visible" ref="modalRef" :title="activeTask?.modalTitle || modalTitle" height="auto"
      width="940" @update:model-value="handleModelUpdate" show-footer @close="cancelActiveTask" teleport="body">
      <div class="modal-content-container" :key="activeTaskId">
        <!-- 1. 表单：仅当前任务未提交时显示 -->
        <template v-if="activeTask && !activeTask.isSubmitting">
          <tiny-form ref="importFormRef" :model="activeTask.formData" :rules="formRules" label-width="120px"
            label-position="top">
            <!-- URL导入表单 -->
            <template v-if="activeTask.activeModal === 'url'">
              <tiny-form-item label="URL地址" prop="url">
                <tiny-input v-model="activeTask.formData.url"
                  placeholder="请输入URL（如https://element-plus.org/zh-CN/component/breadcrumb.html）" clearable />
              </tiny-form-item>
              <tiny-form-item label="API表格CSS选择器" prop="tableSelector">
                <tiny-input v-model="activeTask.formData.tableSelector" placeholder="请输入选择器（如.vp-table）" clearable />
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
                <tiny-file-upload ref="uploadRef" :auto-upload="false" :file-list="activeTask.fileList"
                  @change="(file) => handleFileChange(file, activeTask.id)">
                  <template #trigger>
                    <tiny-button>选择源码文件（支持单个文件/ZIP）</tiny-button>
                  </template>
                </tiny-file-upload>
              </tiny-form-item>
            </template>
          </tiny-form>
        </template>

        <!-- 2. 提交后区域：显示当前活跃任务的进度/结果/错误 -->
        <template v-if="activeTask && activeTask.isSubmitting">
          <!-- 进度条：任务处理中显示 -->
          <div class="import-progress" v-if="activeTask.isImporting">
            <div class="progress-container">
              <p class="progress-text">物料正在导入中...</p>
              <tiny-progress :percentage="activeTask.importProgress" :stroke-width="12" color="#1890ff"
                style="flex: 1; margin-left: 16px;"></tiny-progress>
            </div>
          </div>

          <!-- 错误提示：任务失败时显示 -->
          <div class="error-tip" v-if="activeTask.showErrorTip">
            <tiny-icon-error />
            <span>{{ activeTask.errorText }}</span>
          </div>

          <!-- 成功提示：任务成功时显示 -->
          <div class="success-tip" v-if="activeTask.showSuccessTip">
            <img src="@/assets/success.svg" alt="成功图标" class="success-icon">
            <span>物料导入成功，共{{ activeTask.realMaterialData?.length || 0 }}个组件</span>
          </div>

          <!-- 结果表格：任务成功时显示物料数据 -->
          <template v-if="activeTask.showResultTable">
            <div class="import-result">
              <MaterialTable ref="materialTableRef" :table-data="formatForTable(activeTask.realMaterialData)"
                @delete-material="(row) => handleDeleteMaterial(row, activeTask.id)" :table-max-height="460"
                @delete-prop="(parentRow, type, propRow) => handleDeleteProp(parentRow, type, propRow, activeTask.id)"
                @save-prop="(parentRow, type, editedRow) => handleSaveProp(parentRow, type, editedRow, activeTask.id)"
                :column-widths="{
                  selection: '8%',
                  expand: '8%',
                  componentName: '21%',
                  importType: '21%',
                  importTime: '21%',
                  operation: '21%'
                }" />
            </div>
          </template>
        </template>
      </div>

      <!-- 底部按钮组：根据任务状态切换 -->
      <template #footer>
        <template v-if="activeTask">
          <!-- 未提交：取消 + 确认（发起任务） -->
          <template v-if="!activeTask.isSubmitting">
            <tiny-button @click="cancelActiveTask">取消</tiny-button>
            <tiny-button type="primary" @click="confirmImport"
              :disabled="activeTask.isImporting || activeTask.showResultTable">
              确定
            </tiny-button>
          </template>

          <!-- 已提交：根据状态切换 -->
          <template v-else>
            <!-- 处理中：取消 + 最小化 -->
            <template v-if="activeTask.isImporting">
              <tiny-button @click="cancelActiveTask">取消</tiny-button>
              <tiny-button type="primary" @click="minimizeActiveTask">最小化</tiny-button>
            </template>

            <!-- 完成/失败：取消 + 保存（仅成功时可保存） -->
            <template v-else>
              <tiny-button @click="cancelActiveTask">取消</tiny-button>
              <tiny-button type="primary" @click="saveActiveTask" :disabled="activeTask.showErrorTip">
                保存到物料库
              </tiny-button>
            </template>
          </template>
        </template>
      </template>
    </tiny-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, watch, onBeforeUnmount } from 'vue';
import {
  TinyModal, TinyButton, TinyForm, TinyFormItem, TinyInput,
  TinyFileUpload, TinyProgress, TinyNotify, TinyCard
} from '@opentiny/vue';
import MaterialTable from '@/components/MaterialTable.vue';
import axios from 'axios';
import { IconError } from '@opentiny/vue-icon';

const TinyIconError = IconError()

const baseApi = '/api';

const modalRef = ref(null);
const importFormRef = ref(null);
const uploadRef = ref(null);
const materialTableRef = ref(null);
const uploadAction = ref('http://localhost:3001/api/material/import')
const uploadData = ref({})

const tasks = ref([]);
const activeTaskId = ref(null);
const isOpeningFromCard = ref(false); // false=新任务，true=卡片打开已有任务

const props = defineProps({
  visible: Boolean,
  modalTitle: String,
  activeModal: String,
  materialData: Array
});

const emit = defineEmits(['update:visible', 'cancel', 'import-success']);

// 过滤显示的任务卡片
const filteredVisibleTasks = computed(() => {
  return tasks.value.filter(task => task.isCardVisible);
});

// 当前活跃任务
const activeTask = computed(() => {
  return tasks.value.find(task => task.id === activeTaskId.value) || null;
});

// 表单验证规则
const formRules = ref({
  url: [
    { required: true, message: '请输入有效的URL地址', trigger: ['blur', 'change'] },
    { pattern: /^https?:\/\/.+/, message: 'URL需以http(s)://开头', trigger: ['blur', 'change'] }
  ],
  tableSelector: [
    { required: true, message: '请填写表格CSS选择器', trigger: ['blur', 'change'] }
  ],
  packageName: [
    { required: true, message: '请输入NPM包名', trigger: ['blur', 'change'] }
  ],
  componentName: [
    { required: true, message: '请输入组件名称', trigger: ['blur', 'change'] }
  ],
  sourceFile: [
    { required: true, message: '请选择源码文件', trigger: ['change'] }
  ]
});

// 任务操作：创建/取消/最小化/保存 
// 1. 创建新任务
const createNewTask = () => {
  const taskId = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const newTask = {
    id: taskId,
    modalTitle: props.modalTitle,
    activeModal: props.activeModal,
    backendTaskId: null,
    // 表单数据
    formData: {
      url: '',
      tableSelector: '',
      packageName: '',
      componentName: '',
      sourceFile: null
    },
    fileList: [], // 源码文件列表
    // 进度状态
    isSubmitting: false,
    isImporting: false,
    importProgress: 0,
    progressText: '等待提交...',
    // 结果状态
    showSuccessTip: false,
    showErrorTip: false,
    errorText: '',
    realMaterialData: null, // 后端返回的真实物料数据
    showResultTable: false,
    isCardVisible: false,
    pollingTimerId: null // 轮询定时器
  };
  tasks.value.push(newTask);
  activeTaskId.value = taskId;
};

// 2. 确认导入
const confirmImport = async () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  try {
    await importFormRef.value.validate();

    let requestConfig = {
      url: `${baseApi}/material/import`,
      method: 'POST'
    };

    if (task.activeModal === 'url') {
      requestConfig.data = {
        importType: 'url',
        url: task.formData.url.trim(),
        tableSelector: task.formData.tableSelector.trim()
      };
    }

    else if (task.activeModal === 'npm') {
      requestConfig.data = {
        importType: 'npm',
        packageName: task.formData.packageName.trim(),
        componentName: task.formData.componentName.trim()
      };
    }

    else if (task.activeModal === 'source') {
      if (!task.fileList?.[0]?.raw) {
        throw new Error('请先选择源码文件');
      }
      const formData = new FormData();
      formData.append('importType', 'code');
      formData.append('files', task.fileList[0].raw);
      requestConfig.data = formData;
    }

    // 更新任务状态：提交中
    task.isSubmitting = true;
    task.isImporting = true;
    task.progressText = '物料正在导入中...';
    task.showSuccessTip = false;
    task.showErrorTip = false;

    const res = await axios(requestConfig);
    if (res.data.success && res.data.taskId) {
      task.backendTaskId = res.data.taskId;
      task.progressText = `任务创建成功（ID: ${res.data.taskId}），正在处理...`;
      // 启动轮询查询任务状态
      startTaskPolling(task);
    } else {
      throw new Error(res.data.message || '创建导入任务失败');
    }

  } catch (error) {
    // 处理提交错误
    task.isImporting = false;
    task.showErrorTip = true;
    task.errorText = error.message || '提交失败，请重试';
    TinyNotify({ type: 'error', message: task.errorText, position: 'top-right' });
  }
};

// 启动轮询：查询任务状态
const startTaskPolling = (task) => {
  if (task.pollingTimerId) {
    clearInterval(task.pollingTimerId);
    task.pollingTimerId = null;
  }

  // 每2秒查询一次
  task.pollingTimerId = setInterval(async () => {
    try {
      const res = await axios.get(`${baseApi}/material/status/${task.backendTaskId}`);
      if (res.data.success) {
        const { status, progress, step, result, error } = res.data;

        task.importProgress = progress || 0;

        // 处理不同任务状态
        switch (status) {
          case 'processing':
            break;

          // 成功：停止轮询，显示结果
          case 'success':
            clearInterval(task.pollingTimerId);
            task.isImporting = false;
            task.showSuccessTip = true;
            task.showResultTable = true;
            const backendMaterials = result?.finalSchemas || [];
            task.realMaterialData = backendMaterials.map(material => ({
              ...material,
              // 缓存格式化后的表格显示数据（含schemaData），后续直接复用
              formattedData: {
                id: material.id || material.component,
                component: material.component,
                componentName: material.component || material.name?.zh_CN || '未命名组件',
                chineseName: material.name?.zh_CN || '无中文名称',
                importType: task.activeModal === 'url' ? 'url' : task.activeModal === 'npm' ? 'npm' : 'code',
                importTime: new Date().toLocaleString('zh-CN', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                  hour12: false
                }),
                source: getSourceFromTask(task),
                rawBackendData: material,
                // 首次格式化schemaData
                schemaData: {
                  propertiesList: formatPropertiesForTable(material.schema?.properties || []),
                  eventsList: formatEventsForTable(material.schema?.events || {}),
                  slotsList: formatSlotsForTable(material.schema?.slots || {})
                }
              }
            }));
            break;

          // 失败：停止轮询，显示错误
          case 'failed':
            clearInterval(task.pollingTimerId);
            task.isImporting = false;
            task.showErrorTip = true;
            task.errorText = error?.message || '导入失败，未知错误';
            break;

          // 其他状态：停止轮询
          default:
            clearInterval(task.pollingTimerId);
            task.isImporting = false;
            task.showErrorTip = true;
            task.errorText = `任务状态异常：${status}`;
            break;
        }
      } else {
        throw new Error(res.data.message || '查询任务状态失败');
      }
    } catch (error) {
      clearInterval(task.pollingTimerId);
      task.isImporting = false;
      task.showErrorTip = true;
      task.errorText = `查询失败：${error.message}`;
      TinyNotify({ type: 'error', message: task.errorText, position: 'top-right' });
    }
  }, 2000);
};

// 最小化当前任务（显示卡片）
const minimizeActiveTask = () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  task.isCardVisible = true;
  modalRef.value.close();
  emit('update:visible', false);
};

// 从卡片打开模态框
const openModalFromCard = async (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) {
    TinyNotify({ type: 'error', message: `未找到任务ID: ${taskId}`, position: 'top-right' });
    return;
  }

  isOpeningFromCard.value = true;
  activeTaskId.value = taskId;
  task.isCardVisible = false;

  if (task.backendTaskId && task.isImporting) {
    startTaskPolling(task);
  }

  await nextTick();
  emit('update:visible', true);
};

// 通知后端取消任务的函数
const notifyBackendCancelTask = async (backendTaskId) => {
  if (!backendTaskId) return;
  try {
    await axios.post(`${baseApi}/material/cancel`, {
      taskId: backendTaskId
    });
  } catch (error) {
    console.warn('通知后端终止任务失败：', error.message);
    TinyNotify({ type: 'warning', message: '前端任务已关闭，后端任务可能仍在执行', position: 'top-right' });
  }
};
// 取消当前任务
const cancelActiveTask = async () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  // 关键修改：通知后端取消任务
  if (task.backendTaskId) {
    await notifyBackendCancelTask(task.backendTaskId);
  }

  // 清除轮询
  if (task.pollingTimerId) clearInterval(task.pollingTimerId);
  // 移除任务
  tasks.value = tasks.value.filter(t => t.id !== task.id);
  activeTaskId.value = null;
  modalRef.value.close();
  emit('update:visible', false);
  emit('cancel');
};

// 取消指定任务（卡片上的取消）
const cancelTask = async (taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;

  if (task.backendTaskId) {
    await notifyBackendCancelTask(task.backendTaskId);
  }

  if (task.pollingTimerId) clearInterval(task.pollingTimerId);
  tasks.value = tasks.value.filter(t => t.id !== taskId);
  if (taskId === activeTaskId.value) {
    activeTaskId.value = null;
    modalRef.value.close();
    emit('update:visible', false);
  }
};

// 保存真实物料数据到父组件（仅保存用户选中的物料）
const saveActiveTask = () => {
  if (!activeTask.value) return;
  const task = activeTask.value;

  // 1. 第一步：获取表格中用户选中的行
  const selectedRows = materialTableRef.value?.getSelectedRows() || [];
  if (selectedRows.length === 0) {
    TinyNotify({ type: 'warning', message: '请先选择要保存的物料', position: 'top-right' });
    return;
  }

  // 2. 第二步：校验原始物料数据是否存在
  if (!task.realMaterialData || task.realMaterialData.length === 0) {
    TinyNotify({ type: 'error', message: '无有效物料数据可保存', position: 'top-right' });
    return;
  }

  // 3. 第三步：映射前端导入类型到后端要求的类型
  const importTypeMap = {
    url: 'url',
    npm: 'npm',
    source: 'code'
  };
  const currentImportType = importTypeMap[task.activeModal] || 'code';

  // 4. 第四步：匹配选中行对应的原始物料数据，构建submitData
  const submitData = selectedRows
    .map(selectedRow => {
      // 4.1 通过选中行的component/id，匹配task.realMaterialData中的原始物料项
      // （selectedRow是formatForTable处理后的行，需关联原始数据）
      const matchedMaterial = task.realMaterialData.find(
        rawMaterial => rawMaterial.component === selectedRow.component || rawMaterial.id === selectedRow.id
      );
      return matchedMaterial ? { selectedRow, matchedMaterial } : null;
    })
    .filter(item => item !== null) // 过滤无匹配的无效数据
    .map(({ selectedRow, matchedMaterial }) => ({
      // 4.2 后端必填：componentName（组件名，优先取原始数据）
      componentName: matchedMaterial.component || matchedMaterial.name?.zh_CN || '未命名组件',
      // 4.3 后端必填：importType（严格匹配url/npm/code）
      importType: currentImportType,
      // 4.4 后端必填：source（来源，从任务表单取，保留原有逻辑）
      source: getSourceFromTask(task),
      // 4.5 后端必填：content（物料完整内容，排除formattedData，补充缺失字段）
      content: {
        ...(({ formattedData, ...rest }) => rest)(matchedMaterial), // 排除前端临时字段
        name: matchedMaterial.name || { zh_CN: matchedMaterial.component || '未命名组件' },
        icon: matchedMaterial.icon || 'default-icon',
        group: matchedMaterial.group || 'element-plus',
        category: matchedMaterial.category || 'element-plus',
        description: matchedMaterial.description || `${matchedMaterial.component || '未命名组件'}的默认描述`,
        tags: matchedMaterial.tags || [matchedMaterial.component || '未分类'],
        keywords: matchedMaterial.keywords || [matchedMaterial.component || ''],
        doc_url: matchedMaterial.doc_url || '',
        version: matchedMaterial.version || '1.0.0',
        devMode: matchedMaterial.devMode || 'proCode',
        npm: matchedMaterial.npm || {
          package: task.formData.packageName || 'unknown',
          exportName: matchedMaterial.component || 'unknown'
        },
        configure: matchedMaterial.configure || {
          loop: true,
          condition: true,
          styles: true,
          isContainer: true,
          isModal: false,
          isPopper: false,
          isNullNode: false,
          isLayout: false,
          nestingRule: {
            childWhitelist: '',
            parentWhitelist: '',
            descendantBlacklist: '',
            ancestorWhitelist: ''
          },
          rootSelector: '',
          shortcuts: { properties: [matchedMaterial.component || ''] },
          contextMenu: {
            actions: ['copy', 'remove', 'insert', 'updateAttr', 'bindEvent'],
            disable: []
          },
          clickCapture: false,
          framework: 'Vue'
        },
        snippets: matchedMaterial.snippets
      }
    }));

  // 5. 第五步：校验最终提交数据（避免无有效数据）
  if (submitData.length === 0) {
    TinyNotify({ type: 'error', message: '选中的物料无有效数据，无法保存', position: 'top-right' });
    return;
  }

  // 6. 第六步：提交选中的物料到后端
  axios.post(`${baseApi}/material/save`, { materials: submitData })
    .then(res => {
      if (res.data.success) {
        emit('import-success', submitData);
        cancelActiveTask(); // 保存成功后关闭模态框
      }
    })
    .catch(error => {
      TinyNotify({ type: 'error', message: '保存物料失败：' + error.message, position: 'top-right' });
    });
};

// 根据当前任务类型，获取后端要求的source字段值
const getSourceFromTask = (task) => {
  switch (task.activeModal) {
    case 'url':
      return task.formData.url || '未知URL';
    case 'npm':
      return task.formData.packageName || '未知NPM包';
    case 'source':
      return task.fileList[0]?.name || '未知源码文件';
    default:
      return 'unknown';
  }
};

// 处理源码文件上传（仅保存文件，不自动上传）
const handleFileChange = (file, taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task) return;

  // 仅保留成功选择的文件（过滤无效文件）
  if (file.status === 'ready') {
    task.fileList = [file];
    task.formData.sourceFile = file.raw; // 保存原始文件
  } else if (file.status === 'error') {
    TinyNotify({ type: 'error', message: '文件选择失败，请重试', position: 'top-right' });
  }
};

const formatForTable = (backendData) => {
  if (!Array.isArray(backendData)) return [];
  // 直接返回缓存的formattedData，不生成新对象
  return backendData.map(material => {
    // 兜底：若formattedData不存在，生成基础结构避免报错
    if (!material.formattedData) {
      return {
        id: material.id || material.component || Date.now().toString(),
        component: material.component || '未知组件',
        componentName: material.component || '未知组件',
        schemaData: { propertiesList: [], eventsList: [], slotsList: [] }
      };
    }
    return material.formattedData;
  });
};

// 表格显示专用：格式化properties
const formatPropertiesForTable = (properties = []) => {
  const result = [];
  properties.forEach((group, groupIndex) => {
    const groupName = group.label?.zh_CN || group.label?.text?.zh_CN || '未分组';
    (group.content || []).forEach((prop, propIndex) => {
      result.push({
        groupIndex,
        propIndex,
        groupName,
        propName: prop.property || '未知属性',
        type: prop.type || 'string',
        description: prop.description?.zh_CN || '无描述',
        defaultValue: prop.defaultValue === undefined ? '无' : prop.defaultValue,
        required: prop.required ? '是' : '否',
        renderComponent: prop.widget?.component || ''
      });
    });
  });
  return result;
};

// 表格显示专用：格式化events
const formatEventsForTable = (events = {}) => {
  return Object.entries(events).map(([key, event]) => ({
    eventKey: key,
    name: key || 'unknown',
    type: event.type || 'event',
    description: event.description?.zh_CN || '无描述'
  }));
};

// 表格显示专用：格式化slots
const formatSlotsForTable = (slots = {}) => {
  return Object.entries(slots).map(([key, slot]) => ({
    slotKey: key,
    name: key || 'unknown',
    description: slot.description?.zh_CN || '无描述'
  }));
};


// 删除物料
const handleDeleteMaterial = (row, taskId) => {
  if (!window.confirm(`确定删除该组件物料吗？`)) return;

  const task = tasks.value.find(t => t.id === taskId);
  if (!task || !task.realMaterialData) return;

  // 用表格行的component匹配后端格式原数据（局部过滤，不替换整个数组）
  task.realMaterialData = task.realMaterialData.filter(item =>
    item.component !== row.component
  );
};

// 删除属性（局部更新目标物料的schema，不替换整个数组元素）
const handleDeleteProp = (parentRow, type, propRow, taskId) => {
  if (!window.confirm(`确定删除该${type === 'properties' ? '属性' : type === 'events' ? '事件' : '插槽'}吗？`)) return;

  const task = tasks.value.find(t => t.id === taskId);
  if (!task || !task.realMaterialData) return;

  // 1. 定位目标物料，深拷贝得到修改对象
  const materialIndex = task.realMaterialData.findIndex(
    item => item.id === parentRow.id || item.component === parentRow.component
  );
  if (materialIndex === -1) return;
  const targetMaterial = task.realMaterialData[materialIndex]; // 原数据引用
  const updatedMaterial = JSON.parse(JSON.stringify(targetMaterial)); // 深拷贝用于修改
  updatedMaterial.schema = updatedMaterial.schema || { properties: [], events: {}, slots: {} };

  // 2. 仅修改“updatedMaterial”的schema（不碰原数据）
  switch (type) {
    case 'properties': {
      const propGroup = updatedMaterial.schema.properties[propRow.groupIndex];
      if (propGroup?.content) {
        propGroup.content.splice(propRow.propIndex, 1);
        if (propGroup.content.length === 0) {
          updatedMaterial.schema.properties.splice(propRow.groupIndex, 1);
        }
      }
      break;
    }
    case 'events':
      delete updatedMaterial.schema.events[propRow.eventKey];
      break;
    case 'slots':
      delete updatedMaterial.schema.slots[propRow.slotKey];
      break;
  }

  // 3. 同步到原数据源和缓存
  task.realMaterialData[materialIndex].schema = updatedMaterial.schema;
  targetMaterial.formattedData.schemaData = {
    propertiesList: formatPropertiesForTable(updatedMaterial.schema?.properties || []),
    eventsList: formatEventsForTable(updatedMaterial.schema?.events || {}),
    slotsList: formatSlotsForTable(updatedMaterial.schema?.slots || {})
  };

  TinyNotify({ type: 'success', message: `${type === 'properties' ? '属性' : type === 'events' ? '事件' : '插槽'}删除成功`, position: 'top-right' });
};

// 保存属性（局部更新目标物料的schema，不替换整个数组元素）
const handleSaveProp = async (parentRow, type, editedRow, taskId) => {
  const task = tasks.value.find(t => t.id === taskId);
  if (!task || !task.realMaterialData) return;

  // 1. 定位目标物料，深拷贝得到“修改后数据对象”（updatedMaterial）
  const materialIndex = task.realMaterialData.findIndex(
    item => item.id === parentRow.id || item.component === parentRow.component
  );
  if (materialIndex === -1) return;
  const targetMaterial = task.realMaterialData[materialIndex]; // 原数据引用（仅用于读取，不直接修改）
  const updatedMaterial = JSON.parse(JSON.stringify(targetMaterial)); // 深拷贝，用于修改

  updatedMaterial.schema = updatedMaterial.schema || { properties: [], events: {}, slots: {} };
  const schema = updatedMaterial.schema;

  // 2. 仅修改“深拷贝后的updatedMaterial”的schema（关键：不碰原数据targetMaterial）
  switch (type) {
    case 'properties': {
      const propGroup = schema.properties[editedRow.groupIndex];
      if (propGroup?.content) {
        if (!propGroup.name) propGroup.name = editedRow.groupIndex.toString();
        const targetProp = propGroup.content[editedRow.propIndex];
        Object.assign(targetProp, {
          property: editedRow.propName,
          type: editedRow.type,
          label: { text: { zh_CN: editedRow.propName || targetProp.property } },
          description: { zh_CN: editedRow.description || '' },
          defaultValue: editedRow.defaultValue === '无' ? undefined : editedRow.defaultValue,
          required: editedRow.required === '是',
          readOnly: false,
          disabled: false,
          cols: 12,
          labelPosition: 'left',
          widget: targetProp.widget || { component: 'InputConfigurator', props: { placeholder: '请输入...' } }
        });
        targetProp.widget.component = editedRow.renderComponent || 'InputConfigurator';
      }
      break;
    }

    case 'events': {
      const oldEventKey = editedRow.eventKey;
      const newEventKey = editedRow.name?.trim();
      if (!newEventKey) {
        throw new Error('事件名称不能为空');
      }

      const oldEventData = schema.events[oldEventKey];
      if (!oldEventData) break;

      if (newEventKey !== oldEventKey) {
        delete schema.events[oldEventKey];
        schema.events[newEventKey] = { ...oldEventData };
      }

      const targetEvent = schema.events[newEventKey];
      Object.assign(targetEvent, {
        description: { zh_CN: editedRow.description || '' },
        type: editedRow.type || 'event',
      });
      break;
    }

    case 'slots': {
      const oldSlotKey = editedRow.slotKey;
      const newSlotKey = editedRow.name?.trim();
      if (!newSlotKey) {
        throw new Error('插槽名称不能为空');
      }

      const oldSlotData = schema.slots[oldSlotKey];
      if (!oldSlotData) break;

      if (newSlotKey !== oldSlotKey) {
        delete schema.slots[oldSlotKey];
        schema.slots[newSlotKey] = { ...oldSlotData };
      }

      const targetSlot = schema.slots[newSlotKey];
      Object.assign(targetSlot, {
        label: { zh_CN: editedRow.name || newSlotKey },
        description: { zh_CN: editedRow.description || '' }
      });
      break;
    }
  }

  // 3. 同步修改到“原数据源realMaterialData”（用updatedMaterial的schema覆盖）
  task.realMaterialData[materialIndex].schema = updatedMaterial.schema;
  // 4. 同步更新缓存的formattedData（基于修改后的updatedMaterial.schema生成）
  targetMaterial.formattedData.schemaData = {
    propertiesList: formatPropertiesForTable(schema?.properties || []),
    eventsList: formatEventsForTable(schema?.events || {}),
    slotsList: formatSlotsForTable(schema?.slots || {})
  };

  TinyNotify({ type: 'success', message: `${type === 'properties' ? '属性' : type === 'events' ? '事件' : '插槽'}编辑成功`, position: 'top-right' });
};

// 模态框生命周期 
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    if (isOpeningFromCard.value) {
      isOpeningFromCard.value = false;
      return;
    }
    // 新打开模态框时创建任务
    const needCreateNewTask = !activeTask.value || activeTask.value.isSubmitting;
    if (needCreateNewTask) {
      createNewTask();
    }
  }
}, { immediate: true });

// 处理模态框关闭（仅关闭，不删除任务）
const handleModelUpdate = (value) => {
  emit('update:visible', value);
  if (!value && activeTask.value) {
    // 关闭时若任务还在处理中，自动最小化
    if (activeTask.value.isImporting) {
      activeTask.value.isCardVisible = true;
    }
  }
};

// 全局清理：组件卸载时清除所有轮询
onBeforeUnmount(() => {
  tasks.value.forEach((t) => t.pollingTimerId && clearInterval(t.pollingTimerId));
});
</script>

<style scoped>
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

.modal-content-container {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
  margin-bottom: 16px;
  max-height: 600px;
}

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

.error-tip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff2f0;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #f53f3f;
}

.error-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.success-tip {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #e6f2d5;
  border-radius: 4px;
  margin-bottom: 16px;
  color: #00b42a;
}

.success-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

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