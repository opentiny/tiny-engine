<template>
  <div class="material-management">
    <!-- 导入方式卡片组 -->
    <div class="import-cards">
      <tiny-card title="通过URL导入物料" custom-class="import-card">
        <p>输入URL地址获取API，根据API生成JSON</p>
        <tiny-button round @click="openModal('url')">导入</tiny-button>
      </tiny-card>
      <tiny-card title="通过NPM导入物料" custom-class="import-card">
        <p>获取NPM包内容后，根据NPM包内容生成JSON</p>
        <tiny-button round @click="openModal('npm')">导入</tiny-button>
      </tiny-card>
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
          :options="componentOptions" @change="handleComponentChange"></tiny-select>
        <tiny-search v-model="searchValue" placeholder="请输入关键字搜索" style="flex: 1;" clearable
          @search="handleSearch"></tiny-search>
      </div>

      <template v-if="loading">
        <div class="loading-container" style="text-align: center; padding: 40px;">
          <tiny-loading type="spinner" size="large"></tiny-loading>
          <p style="margin-top: 16px; color: #666;">正在加载物料数据...</p>
        </div>
      </template>
      <template v-else>
        <!-- 传递子表操作所需的类型参数 -->
        <MaterialTable :table-data="materialData" :use-pagination="true" :current-page="page" :page-size="limit"
          :total="totalCount" :schema-data="materialData.map(item => item.schemaData)" @save-prop="handleEditSubItem"
          @delete-prop="handleDeleteSubItem" @delete-material="handleDeleteMaterial"
          @current-change="handleCurrentChange" @size-change="handleSizeChange" ref="materialTableRef" />
      </template>
    </div>

    <ImportModal v-model:visible="modalVisible" :modal-title="modalTitle" :active-modal="activeModal"
      @import-success="handleImportSuccess" />
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import {
  TinyCard,
  TinyButton,
  TinySelect,
  TinySearch,
  TinyLoading,
  TinyNotify
} from '@opentiny/vue';
import MaterialTable from '@/components/MaterialTable.vue';
import ImportModal from '@/components/ImportModal.vue';
import axios from 'axios';

const baseApi = '/api';

// 基础状态
const componentOptions = ref([{ value: 'all', label: '全部组件' }]);
const selectedComponent = ref('all');
const searchValue = ref('');
const materialData = ref([]);
const loading = ref(false);
const subItemLoading = ref({ id: '', type: '' });

// 模态框状态
const modalVisible = ref(false);
const activeModal = ref('');
const modalTitle = ref('');

const materialTableRef = ref(null);

// 分页状态
const page = ref(1);
const limit = ref(10);
const totalCount = ref(0);

onMounted(async () => {
  try {
    await getComponentNames();
    await getMaterialList(); 
  } catch (err) {
    TinyNotify({ type: 'error', message: '页面初始化失败，请刷新重试', position: 'top-right' });
  }
});

// 获取组件名列表
const getComponentNames = async () => {
  try {
    const res = await axios.get(`${baseApi}/materials/component-names`);
    if (res.data.success) {
      componentOptions.value = [
        { value: 'all', label: '全部组件' },
        ...res.data.componentNames.map(name => ({ value: name, label: name }))
      ];
    }
  } catch (err) {
    TinyNotify({ type: 'error', message: '获取组件名失败', position: 'top-right' });
  }
};

// 当前页变化
const handleCurrentChange = (current) => {
  page.value = current;
  getMaterialList();
};

// 每页数量变化
const handleSizeChange = (size) => {
  limit.value = size; 
  page.value = 1; 
  getMaterialList(); 
};

// 获取物料列表
const getMaterialList = async () => {
  loading.value = true;
  if (isNaN(page.value) || page.value < 1) {
    page.value = 1;
  }
  if (isNaN(limit.value) || limit.value < 1 || limit.value > 100) {
    limit.value = 10;
  }
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      keyword: searchValue.value || undefined,
      componentName: selectedComponent.value !== 'all' ? selectedComponent.value : undefined,
      status: 'active'
    };
    const res = await axios.get(`${baseApi}/materials`, { params });
    if (res.data.success) {
      page.value = res.data.currentPage; 
      limit.value = res.data.pageSize;
      totalCount.value = res.data.totalCount;

      // 物料数据映射
      materialData.value = res.data.rows.map(material => ({
        id: material.id,
        componentName: material.componentName,
        chineseName: material.content?.name?.zh_CN || '无中文名称',
        importType: material.importType,
        importTime: formatDateTime(material.createdAt),
        source: material.source,
        content: material.content,
        schemaData: {
          propertiesList: formatProperties(material.content?.schema?.properties || []),
          eventsList: formatEvents(material.content?.schema?.events || {}),
          slotsList: formatSlots(material.content?.schema?.slots || {})
        }
      }));
      totalCount.value = res.data.count;
    }
  } catch (err) {
    TinyNotify({ type: 'error', message: '获取物料列表失败', position: 'top-right' });
  } finally {
    loading.value = false;
  }
};

// 格式化properties（适配子表展示）
const formatProperties = (properties = []) => {
  return properties.flatMap(group =>
    group.content?.map(prop => ({
      groupIndex: properties.indexOf(group),
      propIndex: group.content.indexOf(prop),
      groupName: group.label?.zh_CN || '未分组',
      propName: prop.property || '未知属性',
      type: prop.type || 'string',
      description: prop.description?.zh_CN || '无描述',
      defaultValue: prop.defaultValue === undefined ? '无' : prop.defaultValue,
      required: prop.required ? '是' : '否',
      renderComponent: prop.widget?.component || ''
    })) || []
  );
};

// 格式化events（适配子表展示）
const formatEvents = (events = {}) => {
  return Object.entries(events).map(([key, event]) => ({
    eventKey: key,
    name: key,
    type: event.type || 'event',
    description: event.description?.zh_CN || '无描述'
  }));
};

// 格式化slots（适配子表展示）
const formatSlots = (slots = {}) => {
  return Object.entries(slots).map(([key, slot]) => ({
    slotKey: key,
    name: key,
    description: slot.description?.zh_CN || '无描述'
  }));
};

// 格式化时间
const formatDateTime = (datetimeStr) => {
  if (!datetimeStr) return '';
  const date = new Date(datetimeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
};

// 打开导入模态框
const openModal = (type) => {
  activeModal.value = type;
  modalTitle.value = type === 'url' ? '通过URL导入' : type === 'npm' ? '通过NPM导入' : '通过源码导入';
  modalVisible.value = true;
};

// 组件选择变更
const handleComponentChange = () => {
  page.value = 1;
  getMaterialList();
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  getMaterialList();
};

// 导入成功
const handleImportSuccess = async () => {
  TinyNotify({ type: 'success', message: '物料库已更新！', position: 'top-right' });
  modalVisible.value = false;
  await getComponentNames();
  selectedComponent.value = 'all';
  getMaterialList();
};

// 导出物料
const exportMaterials = async () => {
  // 1. 获取当前页选中行并校验
  const selectedRows = materialTableRef.value?.getSelectedRows() || [];
  if (selectedRows.length === 0) {
    TinyNotify({ type: 'warning', message: '请先选择要导出的物料', position: 'top-right' });
    return;
  }

  // 2. 提取后端原始content（过滤无效数据）
  const materialContents = selectedRows
    .map(row => row.content) 
    .filter(content => content && typeof content === 'object'); 
  if (materialContents.length === 0) {
    TinyNotify({ type: 'error', message: '选中物料无有效content数据，无法导出', position: 'top-right' });
    return;
  }

  try {
    // 3. 生成符合要求的JSON字符串
    const formattedItems = materialContents.map(item =>
      JSON.stringify(item, null, 2) 
    );
    const finalJson = [
      '[',
      formattedItems.join(',\n'),
      ']'
    ].join('\n'); 

    // 4. 创建JSON文件
    const blob = new Blob([finalJson], {
      type: 'application/json; charset=utf-8',
      endings: 'native'
    });
    const blobUrl = URL.createObjectURL(blob);

    // 5. 动态创建a标签触发下载
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    // 设置默认文件名
    const timestamp = new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(/[:/]/g, '-'); 
    downloadLink.download = `物料导出_${timestamp}.json`; 

    // 6. 触发点击
    document.body.appendChild(downloadLink);
    downloadLink.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));

    // 7. 清理临时资源
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl); // 释放Blob内存
      document.body.removeChild(downloadLink); // 移除临时a标签
    }, 100);

    // 8. 提示用户确认弹窗
    TinyNotify({
      type: 'info',
      message: '请选择保存位置',
      position: 'top-right'
    });

  } catch (error) {
    console.error('物料导出失败：', error);
    TinyNotify({ type: 'error', message: `导出失败：${error.message}`, position: 'top-right' });
  }
};
// 批量删除物料
const deleteMaterials = async () => {
  const selectedRows = materialTableRef.value?.getSelectedRows() || [];
  if (selectedRows.length === 0) {
    TinyNotify({ type: 'warning', message: '请先选择要删除的物料', position: 'top-right' });
    return;
  }

  const ids = selectedRows.map(row => {
    const numId = parseInt(row.id, 10);
    return isNaN(numId) ? null : numId; 
  }).filter(id => id !== null);

  if (ids.length === 0) {
    TinyNotify({ type: 'error', message: '选中的物料中存在无效ID，无法删除', position: 'top-right' });
    return;
  }

  if (!window.confirm(`确定彻底删除选中的${ids.length}个物料吗？此操作不可恢复！`)) return;

  try {
    const res = await axios.delete(`${baseApi}/materials/batch`, {
      data: { ids }
    });

    if (res.data.success) {
      TinyNotify({
        type: 'success',
        message: res.data.message || `成功删除${res.data.affectedCount}个物料`,
        position: 'top-right'
      });
      getMaterialList();
    } else {
      TinyNotify({ type: 'error', message: res.data.message || '批量删除失败', position: 'top-right' });
    }

  } catch (err) {
    const errorMsg = err.response?.data?.message || '批量删除请求失败，请重试';
    TinyNotify({ type: 'error', message: errorMsg, position: 'top-right' });
  }
};

// 单个物料删除
const handleDeleteMaterial = async (row) => {
  if (!window.confirm(`确定删除物料“${row.chineseName || row.componentName}”吗？`)) return;
  try {
    const res = await axios.delete(`${baseApi}/materials/${row.id}`);
    if (res.data.success) {
      TinyNotify({ type: 'success', message: '物料删除成功', position: 'top-right' });
      getMaterialList();
    }
  } catch (err) {
    TinyNotify({ type: 'error', message: '物料删除失败', position: 'top-right' });
  }
};

// 子项编辑（属性/事件/slot）
const handleEditSubItem = async (materialRow, type, editedRow) => {
  subItemLoading.value = { id: materialRow.id, type };
  try {
    const updatedContent = JSON.parse(JSON.stringify(materialRow.content));
    updatedContent.schema = updatedContent.schema || { properties: [], events: {}, slots: {} };
    const schema = updatedContent.schema;

    switch (type) {
      case 'properties':
        const propGroup = schema.properties[editedRow.groupIndex];
        if (propGroup?.content) {
          const targetProp = propGroup.content[editedRow.propIndex];
          targetProp.property = editedRow.propName;
          targetProp.type = editedRow.type;
          targetProp.description = { zh_CN: editedRow.description };
          targetProp.defaultValue = editedRow.defaultValue === '无' ? undefined : editedRow.defaultValue;
          targetProp.required = editedRow.required === '是';

          targetProp.widget = targetProp.widget || {};
          targetProp.widget.component = editedRow.renderComponent;
        }
        break;

      case 'events':
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
        targetEvent.description = { zh_CN: editedRow.description || '' };
        targetEvent.type = editedRow.type || 'event';
        break;

      case 'slots':
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
        targetSlot.label = { zh_CN: newSlotKey }; 
        targetSlot.description = { zh_CN: editedRow.description || '' };
        break;
    }

    const res = await axios.put(`${baseApi}/materials/${materialRow.id}`, {
      content: updatedContent
    });

    if (res.data.success && res.data.affectedCount > 0) {
      TinyNotify({ type: 'success', message: `${type === 'properties' ? '属性' : type === 'events' ? '事件' : 'Slot'}编辑成功`, position: 'top-right' });
      const materialIndex = materialData.value.findIndex(item => item.id === materialRow.id);
      if (materialIndex > -1) {
        materialData.value[materialIndex].content = updatedContent;
        materialData.value[materialIndex].schemaData = {
          propertiesList: formatProperties(schema?.properties || []),
          eventsList: formatEvents(schema?.events || {}),
          slotsList: formatSlots(schema?.slots || {})
        };
      }
    }

  } catch (err) {
    TinyNotify({ type: 'error', message: `${type === 'properties' ? '属性' : type === 'events' ? '事件' : 'Slot'}编辑失败`, position: 'top-right' });
  } finally {
    subItemLoading.value = { id: '', type: '' };
  }
};

// 子项删除（属性/事件/slot）
const handleDeleteSubItem = async (materialRow, type, deletedRow) => {
  if (!window.confirm(`确定删除该${type === 'properties' ? '属性' : type === 'events' ? '事件' : 'Slot'}吗？`)) return;

  subItemLoading.value = { id: materialRow.id, type };
  try {
    const updatedContent = JSON.parse(JSON.stringify(materialRow.content));
    updatedContent.schema = updatedContent.schema || { properties: [], events: {}, slots: {} };

    switch (type) {
      case 'properties':
        const propGroup = updatedContent.schema.properties[deletedRow.groupIndex];
        if (propGroup?.content) {
          propGroup.content.splice(deletedRow.propIndex, 1);
          // 若分组无属性，可选择删除空分组
          if (propGroup.content.length === 0) {
            updatedContent.schema.properties.splice(deletedRow.groupIndex, 1);
          }
        }
        break;

      case 'events':
        delete updatedContent.schema.events[deletedRow.eventKey];
        break;

      case 'slots':
        delete updatedContent.schema.slots[deletedRow.slotKey];
        break;
    }

    const res = await axios.put(`${baseApi}/materials/${materialRow.id}`, {
      content: updatedContent
    });

    if (res.data.success && res.data.affectedCount > 0) {
      TinyNotify({ type: 'success', message: `${type === 'properties' ? '属性' : type === 'events' ? '事件' : 'Slot'}删除成功`, position: 'top-right' });
      const materialIndex = materialData.value.findIndex(item => item.id === materialRow.id);
      if (materialIndex > -1) {
        materialData.value[materialIndex].content = updatedContent;
        materialData.value[materialIndex].schemaData = {
          propertiesList: formatProperties(updatedContent.schema?.properties || []),
          eventsList: formatEvents(updatedContent.schema?.events || {}),
          slotsList: formatSlots(updatedContent.schema?.slots || {})
        };
      }
    }

  } catch (err) {
    TinyNotify({ type: 'error', message: `${type === 'properties' ? '属性' : type === 'events' ? '事件' : 'Slot'}删除失败`, position: 'top-right' });
  } finally {
    subItemLoading.value = { id: '', type: '' };
  }
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

.loading-container {
  text-align: center;
  padding: 40px;
}

.import-progress {
  padding: 16px;
  text-align: center;
  margin-top: 16px;
}

.import-result {
  padding: 16px 0;
  margin-top: 16px;
}

:deep(.tiny-form-item) {
  margin-bottom: 16px;
}

:deep(.tiny-input),
:deep(.tiny-upload) {
  width: 100%;
}
</style>