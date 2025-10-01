<template>
  <tiny-grid :data="paginatedData" show-overflow :fit="true" style="width: 100%;" ref="materialGridRef"
    :max-height="tableMaxHeight || undefined">
    <tiny-grid-column type="selection" width="60"></tiny-grid-column>
    <tiny-grid-column type="expand" width="50" title="">
      <template #expand-trigger="{ row, $table }">
        <tiny-button type="text" size="small">
          <TinyIconUpWard v-if="$table.hasRowExpand(row)" />
          <TinyIconDownWard v-else />
        </tiny-button>
      </template>

      <!-- 自定义展开内容（子表） -->
      <template #default="{ row }">
        <tiny-grid :data="row.propsData" :fit="true" show-overflow style="margin: 8px 0; width: 100%;"
          :edit-config="{ trigger: 'manual', mode: 'row', showStatus: false, blurOutside: ({ cell, event, $table }) => { return true; } }">
          <tiny-grid-column field="propName" title="属性名称" width="20%"
            :editor="{ component: 'input', autoselect: true }" />
          <tiny-grid-column field="propType" title="属性类型" width="20%"
            :editor="{ component: 'input', autoselect: true }" />
          <tiny-grid-column field="renderComponent" title="渲染组件" width="20%"
            :editor="{ component: 'select', options: renderComponentOptions }" />
          <tiny-grid-column field="description" title="说明" width="20%"
            :editor="{ component: 'input', autoselect: true }" />
          <tiny-grid-column field="operation" title="操作" width="20%">
            <template #default="{ row: propRow, $table: propTable }">
              <!-- 编辑状态：显示【保存】【取消】 -->
              <template v-if="propTable.hasActiveRow(propRow)">
                <tiny-button type="text" @click="savePropRow(row, propRow, propTable)">保存</tiny-button>
                <tiny-button type="text" @click="cancelPropRow(propRow, propTable)">取消</tiny-button>
              </template>
              <!-- 非编辑状态：显示【编辑】【删除】 -->
              <template v-else>
                <tiny-button type="text" @click="editPropRow(propRow, propTable)">编辑</tiny-button>
                <tiny-button type="text" @click="handleDeleteProp(row, propRow)">删除</tiny-button>
              </template>
            </template>
          </tiny-grid-column>
        </tiny-grid>
      </template>
    </tiny-grid-column>

    <!-- 普通数据列 -->
    <tiny-grid-column field="name" title="物料" />
    <tiny-grid-column field="importTime" title="导入时间" />
    <tiny-grid-column field="operation" title="操作">
      <template #default="{ row }">
        <tiny-button type="text" @click="handleDeleteMaterial(row)">删除</tiny-button>
      </template>
    </tiny-grid-column>
  </tiny-grid>

  <!-- 分页组件，仅在usePagination为true时显示 -->
  <template v-if="usePagination">
    <tiny-pager :current-page="pager.currentPage" :page-size="pager.pageSize" :total="pager.total"
      :page-sizes="[5, 10, 20, 50]" @current-change="handleCurrentChange" @size-change="handleSizeChange"
      layout="total, sizes, prev, pager, next, jumper" style="margin-top: 16px; text-align: right;"></tiny-pager>
  </template>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue';
import { TinyGrid, TinyGridColumn, TinyButton, TinyPager } from '@opentiny/vue';
import { IconUpWard, IconDownWard } from '@opentiny/vue-icon';

// 定义图标组件
const TinyIconUpWard = IconUpWard();
const TinyIconDownWard = IconDownWard();

// 接收父组件传递的表格数据
const props = defineProps({
  tableData: {
    type: Array,
    required: true,
    default: () => []
  },
  usePagination: {
    type: Boolean,
    default: false
  },
  // 关键新增：接收父组件传递的表格高度，支持Number（像素）或String（如'300px'）
  tableMaxHeight: {
    type: [Number, String],
    default: undefined  // 默认不传递，保持tiny-grid默认行为
  }
});

// 定义需要向父组件传递的事件
const emit = defineEmits([
  'edit-prop',    // 编辑属性事件
  'delete-prop',  // 删除属性事件
  'delete-material', // 删除物料事件
  'save-prop'     // 子表保存属性
]);

// 表格实例引用
const materialGridRef = ref(null);

// 分页相关状态
const pager = ref({
  currentPage: 1,
  pageSize: 5,
  total: 0
});

// 计算分页后的数据
const paginatedData = computed(() => {
  if (!props.usePagination) {
    return props.tableData;
  }
  const startIndex = (pager.value.currentPage - 1) * pager.value.pageSize;
  const endIndex = startIndex + pager.value.pageSize;
  return props.tableData.slice(startIndex, endIndex);
});

// 初始化分页总条数
onMounted(() => {
  if (props.usePagination) {
    pager.value.total = props.tableData.length;
  }
});

// 处理页码变化
const handleCurrentChange = (current) => {
  pager.value.currentPage = current;
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  pager.value.pageSize = size;
  pager.value.currentPage = 1;
};


// 定义渲染组件的下拉选项
const renderComponentOptions = [
  { label: '下拉框', value: '下拉框' },
  { label: '输入框', value: '输入框' },
  { label: '复选框', value: '复选框' },
  { label: '单选框', value: '单选框' }
];

// --------------- 子表编辑/保存/取消方法（保留，不变） ---------------
// 1. 子表：激活编辑行
const editPropRow = (propRow, propTable) => {
  // propTable 是当前子表实例（从模板$table传入）
  propTable.setActiveRow(propRow);
};

// 2. 子表：保存修改（清除编辑状态+通知父组件）
const savePropRow = (parentRow, propRow, propTable) => {
  // 清除子表当前行编辑状态
  propTable.clearActived();
  // 通知父组件保存属性修改（传递父行+当前修改后的属性行）
  emit('save-prop', parentRow, propRow);
};

// 3. 子表：取消修改（清除编辑状态+恢复原始数据）
const cancelPropRow = (propRow, propTable) => {
  // 1. 清除编辑状态 2. 恢复该属性行原始数据
  propTable.clearActived().then(() => propTable.revertData(propRow));
};
// 编辑属性 - 触发父组件事件
const handleEditProp = (row, propRow) => {
  emit('edit-prop', row, propRow);
};

// 删除属性 - 触发父组件事件
const handleDeleteProp = (row, propRow) => {
  emit('delete-prop', row, propRow);
};

// 删除物料 - 触发父组件事件
const handleDeleteMaterial = (row) => {
  emit('delete-material', row);
};

// 暴露表格实例给父组件（如需在父组件调用表格方法）
defineExpose({
  materialGridRef
});
</script>
