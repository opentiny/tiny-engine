<template>
  <tiny-grid :data="data" :tree-config="{ children: 'children', indent: 6 }">
    <tiny-grid-column field="prop" title="字段" width="100" tree-node></tiny-grid-column>
    <tiny-grid-column field="type" title="类型" width="40"></tiny-grid-column>
    <tiny-grid-column field="description" show-overflow title="描述" width="80"></tiny-grid-column>
    <tiny-grid-column field="required" title="是否必填" width="60">
      <template #default="data">
        <span>{{ data.row?.required ? '是' : '否' }}</span>
      </template>
    </tiny-grid-column>
  </tiny-grid>
</template>

<script setup>
import { Grid as TinyGrid, GridColumn as TinyGridColumn } from '@opentiny/vue'

defineProps({
  // 入参或出参数据
  data: {
    type: Array,
    default: () => []
  },
  // 入参或出参类型标注
  type: String
})
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
