<template>
  <div class="section">
    <div class="section-header">
      <h4 class="section-title">字段管理</h4>
      <tiny-button type="primary" size="small" class="add-field-btn" @click="$emit('add-field')">
        <template #icon><icon-plus /></template>
        添加字段
      </tiny-button>
    </div>
    <div class="field-table">
      <tiny-grid
        :data="model.parameters"
        :height="'100%'"
        :header-fixed="true"
        :scrollable="{ y: true }"
        :expand-config="expandConfig"
        ref="fieldGrid"
        style="height: 100%"
      >
        <tiny-grid-column type="index" width="50" title="序号"></tiny-grid-column>
        <tiny-grid-column type="expand" width="30">
          <template #default="{ row }">
            <div v-if="row.type === 'Enum'" class="expand-content">
              <div class="expand-section">
                <h4>默认选项（下拉框）</h4>
                <div class="enum-values">
                  <div v-for="(opt, index) in row.options || [{ value: '', label: '' }]" :key="index" class="enum-item">
                    <tiny-input
                      v-model="opt.value"
                      placeholder="值"
                      size="small"
                      style="width: 150px; margin-right: 8px"
                    />
                    <tiny-input
                      v-model="opt.label"
                      placeholder="显示标签"
                      size="small"
                      style="width: 200px; margin-right: 8px"
                    />
                    <tiny-button type="text" size="small" @click="$emit('insert-enum-after', row, index)"
                      >新增</tiny-button
                    >
                    <tiny-button type="text" size="small" @click="$emit('remove-enum', row, index)">删除</tiny-button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </tiny-grid-column>
        <slot />
      </tiny-grid>
    </div>
  </div>
</template>

<script setup>
// 字段表格与展开编辑内容组件
// 仅承载表格与展开内容，具体列通过插槽从父组件传入，保证与现有逻辑一致
import { ref } from 'vue'
import { TinyButton, TinyGrid, TinyGridColumn, TinyInput } from '@opentiny/vue'
import { IconPlus } from '@opentiny/vue-icon'

defineProps({
  model: { type: Object, required: true },
  expandConfig: { type: Object, required: true }
})

defineEmits(['add-field', 'insert-enum-after', 'remove-enum'])

const fieldGrid = ref(null)

// 父组件需要：
// 1) 读取 grid 数据以拿到 _RID
const getGridData = () => fieldGrid.value?.getData?.() || []

defineExpose({
  fieldGrid,
  getGridData
})
</script>

<style scoped>
.section {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  flex: 1;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-title {
  margin: 0;
  border-bottom: none;
  padding-bottom: 0;
  font-size: 16px;
  font-weight: 600;
}
.field-table {
  overflow: hidden;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.field-table :deep(.tiny-grid) {
  flex: 1;
}
.expand-content {
  padding: 8px 12px;
  background: #fafafa;
  border-top: 1px solid #eaeaea;
}
.expand-section {
  margin-bottom: 16px;
}
.expand-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
  padding-bottom: 1px;
}
.enum-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}
.variable-editor {
  height: 260px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}
.mm-fs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 4px 8px;
}
.mm-fs-head .title {
  font-size: 12px;
  font-weight: 600;
}
</style>
