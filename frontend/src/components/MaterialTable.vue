<template>
  <tiny-grid :data="paginatedData" show-overflow :fit="true" style="width: 100%;" ref="materialGridRef"
    :max-height="tableMaxHeight || undefined">
    <tiny-grid-column type="selection" :width="columnWidths.selection"></tiny-grid-column>
    <tiny-grid-column type="expand" :width="columnWidths.expand" title="">
      <template #expand-trigger="{ row, $table }">
        <tiny-button type="text" size="small">
          <tiny-icon-upWard v-if="$table.hasRowExpand(row)" />
          <tiny-icon-downWard v-else />
        </tiny-button>
      </template>

      <template #default="{ row }">
        <!-- 1. 属性子表：无数据则不显示 -->
        <div class="sub-table-container" v-if="row.schemaData?.propertiesList?.length > 0">
          <tiny-grid :data="row.schemaData.propertiesList" :fit="true" show-overflow style="width: 100%;" :edit-config="{
            trigger: 'manual',
            mode: 'row',
            showStatus: false,
            blurOutside: ({ cell, event, $table }) => {
              $table.commitEdit(cell);
              return true;
            }
          }">
            <tiny-grid-column field="propName" title="属性名称" width="20%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="type" title="属性类型" width="20%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="renderComponent" title="渲染组件" width="20%" :editor="{
              component: TinySelect,
              attrs: {
                options: configuratorOptions,
                textField: 'label',
                valueField: 'value',
                style: { width: '100%' }
              }
            }" :format-config="{
              data: configuratorOptions,
              label: 'label',
              value: 'value'
            }" format-text="enum" />
            <tiny-grid-column field="description" title="说明" width="20%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="operation" title="操作" width="20%">
              <template #default="{ row: propRow, $table: propTable }">
                <template v-if="propTable.hasActiveRow(propRow)">
                  <tiny-button type="text" @click="savePropRow(row, 'properties', propRow, propTable)">保存</tiny-button>
                  <tiny-button type="text" @click="cancelPropRow(propRow, propTable)">取消</tiny-button>
                </template>
                <template v-else>
                  <tiny-button type="text" @click="editPropRow(propRow, propTable)">编辑</tiny-button>
                  <tiny-button type="text" @click="handleDeleteProp(row, 'properties', propRow)">删除</tiny-button>
                </template>
              </template>
            </tiny-grid-column>
          </tiny-grid>
        </div>

        <!-- 2. 事件子表：无数据则不显示 -->
        <div class="sub-table-container" v-if="row.schemaData?.eventsList?.length > 0">
          <tiny-grid :data="row.schemaData.eventsList" :fit="true" show-overflow style="width: 100%;" :edit-config="{
            trigger: 'manual',
            mode: 'row',
            showStatus: false,
            blurOutside: ({ cell, event, $table }) => {
              $table.commitEdit(cell);
              return true;
            }
          }">
            <tiny-grid-column field="name" title="事件名称" width="25%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="type" title="事件类型" width="25%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="description" title="说明" width="30%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="operation" title="操作" width="20%">
              <template #default="{ row: eventRow, $table: eventTable }">
                <template v-if="eventTable.hasActiveRow(eventRow)">
                  <tiny-button type="text" @click="savePropRow(row, 'events', eventRow, eventTable)">保存</tiny-button>
                  <tiny-button type="text" @click="cancelPropRow(eventRow, eventTable)">取消</tiny-button>
                </template>
                <template v-else>
                  <tiny-button type="text" @click="editPropRow(eventRow, eventTable)">编辑</tiny-button>
                  <tiny-button type="text" @click="handleDeleteProp(row, 'events', eventRow)">删除</tiny-button>
                </template>
              </template>
            </tiny-grid-column>
          </tiny-grid>
        </div>

        <!-- 3. 插槽子表：无数据则不显示 -->
        <div class="sub-table-container" v-if="row.schemaData?.slotsList?.length > 0">
          <tiny-grid :data="row.schemaData.slotsList" :fit="true" show-overflow style="width: 100%;" :edit-config="{
            trigger: 'manual',
            mode: 'row',
            showStatus: false,
            blurOutside: ({ cell, event, $table }) => {
              $table.commitEdit(cell);
              return true;
            }
          }">
            <tiny-grid-column field="name" title="插槽名称" width="30%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="description" title="说明" width="40%"
              :editor="{ component: 'input', autoselect: true }" />
            <tiny-grid-column field="operation" title="操作" width="30%">
              <template #default="{ row: slotRow, $table: eventTable }">
                <template v-if="eventTable.hasActiveRow(slotRow)">
                  <tiny-button type="text" @click="savePropRow(row, 'slots', slotRow, eventTable)">保存</tiny-button>
                  <tiny-button type="text" @click="cancelPropRow(slotRow, eventTable)">取消</tiny-button>
                </template>
                <template v-else>
                  <tiny-button type="text" @click="editPropRow(slotRow, eventTable)">编辑</tiny-button>
                  <tiny-button type="text" @click="handleDeleteProp(row, 'slots', slotRow)">删除</tiny-button>
                </template>
              </template>
            </tiny-grid-column>
          </tiny-grid>
        </div>

        <!-- 无数据提示 -->
        <div class="no-data-tip"
          v-if="!row.schemaData?.propertiesList?.length && !row.schemaData?.eventsList?.length && !row.schemaData?.slotsList?.length">
          暂无属性、事件或插槽数据
        </div>
      </template>
    </tiny-grid-column>

    <!-- 普通数据列 -->
    <tiny-grid-column field="componentName" title="组件名称" :width="columnWidths.componentName" />
    <tiny-grid-column field="importType" title="导入类型" :width="columnWidths.importType">
      <template #default="{ row }">
        {{ importTypeMap[row.importType] || importTypeMap.unknown }}
      </template>
    </tiny-grid-column>
    <tiny-grid-column field="importTime" title="导入时间" :width="columnWidths.importTime" />
    <tiny-grid-column field="operation" title="操作" :width="columnWidths.operation">
      <template #default="{ row }">
        <tiny-button type="text" @click="handleDeleteMaterial(row)">删除</tiny-button>
      </template>
    </tiny-grid-column>
  </tiny-grid>

  <!-- 分页组件 -->
  <template v-if="usePagination">
    <tiny-pager :current-page="currentPage" :page-size="pageSize" :total="total" :page-sizes="[5, 10, 20, 50]"
      @current-change="handleCurrentChange" @size-change="handleSizeChange"
      layout="total, sizes, prev, pager, next, jumper" style="margin-top: 16px; text-align: right;"></tiny-pager>
  </template>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue';
import { TinyGrid, TinyGridColumn, TinyButton, TinyPager, TinySelect } from '@opentiny/vue';
import { IconUpWard, IconDownWard } from '@opentiny/vue-icon';

// 定义图标组件
const TinyIconUpWard = IconUpWard();
const TinyIconDownWard = IconDownWard();

// 接收父组件传递的参数
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
  tableMaxHeight: {
    type: [Number, String],
    default: undefined
  },
  schemaData: {
    type: Array,
    default: () => []
  },
  currentPage: { type: Number, default: 1 }, // 当前页
  pageSize: { type: Number, default: 10 },   // 每页数量
  total: { type: Number, default: 0 },        // 总条数
  columnWidths: {
    type: Object,
    default: () => ({
      selection: '5%',
      expand: '5%',
      componentName: '25%',
      importType: '20%',
      importTime: '25%',
      operation: '20%'
    }),
    description: '最外层表格列宽配置对象，可只传需要修改的列，未传列使用默认值'
  }
});

// 定义需要向父组件传递的事件
const emit = defineEmits([
  'delete-prop',     // 删除属性/事件/插槽
  'delete-material', // 删除物料
  'save-prop',       // 保存属性/事件/插槽修改
  'current-change',  // 当前页变化
  'size-change'      // 每页数量变化
]);


const paginatedData = computed(() => {
  if (props.usePagination) return props.tableData;
  return props.tableData;
});


const materialGridRef = ref(null);

const configuratorOptions = ref([
  { label: '容器配置器', value: 'ContainerConfigurator' },
  { label: '输入框配置器', value: 'InputConfigurator' },
  { label: '按钮组配置器', value: 'ButtonGroupConfigurator' },
  { label: '数组项配置器', value: 'ArrayItemConfigurator' },
  { label: '颜色配置器', value: 'ColorConfigurator' },
  { label: '数字配置器', value: 'NumberConfigurator' },
  { label: '复选框配置器', value: 'CheckBoxConfigurator' },
  { label: '国际化配置器', value: 'I18nConfigurator' },
  { label: 'HTML属性配置器', value: 'HtmlAttributesConfigurator' },
  { label: '开关配置器', value: 'SwitchConfigurator' },
  { label: '代码配置器', value: 'CodeConfigurator' },
  { label: 'HTML文本配置器', value: 'HtmlTextConfigurator' },
  { label: '选择器配置器', value: 'SelectConfigurator' },
  { label: '布局网格配置器', value: 'LayoutGridConfigurator' }
])

const importTypeMap = ref({
  code: '源码导入',
  npm: 'NPM导入',
  url: 'URL导入',
  unknown: '未知导入'
});

// 当前页变化
const handleCurrentChange = (current) => {
  emit('current-change', current);
};
// 每页数量变化（重置当前页为1）
const handleSizeChange = (size) => {
  emit('size-change', size);
  emit('current-change', 1);
};

// 子表编辑/保存/取消方法（适配三种子表）
const editPropRow = (row, tableInstance) => {
  tableInstance.setActiveRow(row);
};

const savePropRow = (parentRow, type, row, tableInstance) => {
  tableInstance.clearActived();
  emit('save-prop', parentRow, type, row);
};

const cancelPropRow = (row, tableInstance) => {
  tableInstance.clearActived().then(() => tableInstance.revertData(row));
};

const handleDeleteProp = (parentRow, type, row) => {
  emit('delete-prop', parentRow, type, row);
};

const handleDeleteMaterial = (row) => {
  emit('delete-material', row);
};

defineExpose({
  materialGridRef,
  getSelectedRows() {
    return materialGridRef.value?.getSelectRecords() || [];
  }
});
</script>

<style scoped>
.sub-table-container {
  margin: 20px 0;
}

.no-data-tip {
  padding: 32px;
  text-align: center;
  color: #666;
  font-size: 14px;
  background-color: #f9fafb;
  border-radius: 4px;
}

:deep(.tiny-grid .tiny-grid-body td) {
  padding: 8px 12px;
}

:deep(.tiny-grid .tiny-grid-body .tiny-grid-cell-active) {
  background-color: #fffbe6;
}
</style>
