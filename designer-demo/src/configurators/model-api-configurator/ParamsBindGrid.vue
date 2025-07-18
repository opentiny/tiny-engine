<template>
  <tiny-form ref="ruleFormRef" :model="validateData" :rules="rules">
    <tiny-grid
      :data="tableData"
      :tree-config="{ children: 'children', indent: 6 }"
    >
      <tiny-grid-column type="index" title="序号" width="60"></tiny-grid-column>
      <tiny-grid-column
        field="prop"
        title="字段"
        width="140"
        tree-node
      ></tiny-grid-column>
      <tiny-grid-column field="type" title="类型" width="60"></tiny-grid-column>
      <tiny-grid-column
        field="description"
        show-overflow
        title="描述"
        width="100"
      ></tiny-grid-column>
      <tiny-grid-column field="required" title="是否必填" width="66">
        <template #default="data">
          <span>{{ data.row?.required ? "是" : "否" }}</span>
        </template>
      </tiny-grid-column>
      <tiny-grid-column field="modelType" title="绑定类型" width="100">
        <template #default="data">
          <tiny-select
            v-model="data.row.modelType"
            value-field="value"
            text-field="label"
            :tree-op="typeOptions"
            @change="data.row.bindValue = null"
            render-type="tree"
            clearable
          >
          </tiny-select>
        </template>
      </tiny-grid-column>
      <tiny-grid-column field="varible" title="绑定字段" width="140">
        <template #default="data">
          <tiny-form-item :prop="data.row.prop" :show-message="false">
            <tiny-select
              v-model="data.row.bindValue"
              value-key="value"
              value-field="value"
              text-field="label"
              render-type="tree"
              :tree-op="modelTypeChange(data.row.modelType)"
              @change="varibleChange"
              clearable
            >
            </tiny-select>
          </tiny-form-item>
        </template>
      </tiny-grid-column>
    </tiny-grid>
  </tiny-form>
</template>

<script setup>
import {
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Select as TinySelect,
  Form as TinyForm,
  FormItem as TinyFormItem,
} from "@opentiny/vue";
import { defineExpose, defineProps, ref, computed, reactive } from "vue";
import { useCanvas } from "@opentiny/tiny-engine";

const props = defineProps({
  // 入参或出参数据
  data: {
    type: Object,
    default: [],
  },
  // 入参或出参类型标注
  type: String,
});

const { getPageSchema } = useCanvas();
const ruleFormRef = ref();

const addModelTypeToTableData = (gridData) => {
  gridData.forEach((item) => {
    item.modelType = "model";
    if (item.children?.length) {
      addModelTypeToTableData(item.children);
    }
  });
};

const tableData = computed(() => {
  const gridData = [...props.data];
  addModelTypeToTableData(gridData);
  return gridData;
});

const validateData = reactive({});

const rules = computed(() => {
  const rulesMap = {};
  tableData.value.forEach((item) => {
    if (item?.required) {
      rulesMap[item.prop] = [{ required: true, trigger: "blur" }];
    }
  });
  return rulesMap;
});

defineExpose({
  validateForm: () => {
    return ruleFormRef.value.validate().then((valid) => {
      return valid;
    });
  },
  getData: () => tableData.value,
});
</script>

<style lang="less">
.tiny-grid {
  .tiny-grid__header,
  .tiny-grid__body {
    width: 100% !important;
    .tiny-grid-body__row {
      height: 36px;
      .col__treenode {
        border-bottom: 1px solid var(--te-common-border-divider) !important;
      }
      .tiny-grid-cell {
        .tiny-form-item {
          .tiny-form-item__content {
            margin: 0 !important;
          }
        }
      }
    }
  }
  .tiny-grid__empty-block {
    padding: 20px 0;
  }
}
.tiny-tree-node.is-leaf:not(.is-root) .tiny-tree-node__content {
  padding-left: 4px;
  .tiny-tree-node__content-left {
    padding: 0 6px;
  }
}
</style>
