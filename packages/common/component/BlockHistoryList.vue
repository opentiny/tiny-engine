<template>
  <tiny-grid v-if="history.length" :data="history" row-id="id" height="300">
    <tiny-grid-column v-if="isBlockManage" field="version" title="版本号">
      <template v-slot="data">
        {{ data.row.version }}
        <span v-if="data.row.version === lastVersion.versions" class="version-v">最新</span>
      </template>
    </tiny-grid-column>
    <tiny-grid-column field="updated_at" title="发布时间">
      <template v-slot="data">
        {{ format(data.row.updated_at, 'yyyy/MM/dd hh:mm:ss') }}
      </template>
    </tiny-grid-column>
    <tiny-grid-column field="message" title="描述"></tiny-grid-column>
    <tiny-grid-column width="90" field="operation" title="操作">
      <template v-slot="data">
        <span class="operation-text" @click="$emit('preview', data.row)">预览</span>
        <span v-if="!isBlockManage" class="operation-text" @click="$emit('restore', data.row)">还原</span>
      </template>
    </tiny-grid-column>
  </tiny-grid>
  <div v-if="!history.length" class="empty">暂无数据</div>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue'
import { format } from '@opentiny/vue-renderless/common/date'
import { Grid as TinyGrid, GridColumn as TinyGridColumn } from '@opentiny/vue'

defineProps({
  history: {
    type: Array,
    default: () => []
  },
  isBlockManage: {
    type: Boolean,
    default: false
  },
  lastVersion: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['preview', 'restore'])
</script>

<style lang="less" scoped>
.version-v {
  font-size: 12px;
  padding: 2px 8px;
  margin-left: 5px;
  background-color: var(--te-common-bg-tag);
  color: var(--te-common-color-success);
  border-radius: var(--te-base-border-radius-1);
}
.operation-text {
  color: var(--te-common-text-emphasize);
  & + .operation-text {
    margin-left: 8px;
  }
}

.empty {
  color: var(--te-common-text-weaken);
}
</style>
