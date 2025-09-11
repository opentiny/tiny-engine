<template>
  <div class="left-panel">
    <div class="panel-header">
      <div class="search-section">
        <tiny-input
          v-model="localKeyword"
          clearable
          placeholder="搜索模型"
          @input="$emit('update:searchKeyword', localKeyword)"
        >
          <template #suffix>
            <tiny-icon-search />
          </template>
        </tiny-input>
      </div>
      <div class="action-section">
        <tiny-button type="primary" class="add-model-btn" @click="$emit('add-model')">
          <template #icon>
            <icon-plus />
          </template>
          添加
        </tiny-button>
        <tiny-button v-if="models?.length" type="text" class="add-model-btn" @click="$emit('export-model')">
          <template #icon>
            <icon-plus />
          </template>
          导出SQL
        </tiny-button>
      </div>
    </div>
    <div class="model-list">
      <template v-if="models.length">
        <div v-for="model in models" :key="model.id" class="model-item" @click="$emit('select-model', model)">
          <div class="model-info">
            <div class="model-name">{{ model.nameCn }}</div>
            <div class="model-english-name">{{ model.nameEn }}</div>
            <div class="model-desc">{{ model.description || '暂无描述' }}</div>
          </div>
          <div class="model-actions">
            <svg-icon name="delete" @click.stop="$emit('delete-model', model)"></svg-icon>
          </div>
        </div>
      </template>
      <div v-else class="empty-tip">当前数据为空，请先添加模型</div>
    </div>
  </div>
</template>

<script setup>
// 左侧模型列表组件
// 中文注释，保留原有交互：搜索、添加、选择、删除
import { ref } from 'vue'
import { TinyInput, TinyButton } from '@opentiny/vue'
import { IconPlus } from '@opentiny/vue-icon'

defineProps({
  models: { type: Array, default: () => [] },
  searchKeyword: { type: String, default: '' }
})

defineEmits(['update:searchKeyword', 'add-model', 'export-model', 'select-model', 'delete-model'])

const localKeyword = ref('')
</script>

<style scoped>
.left-panel {
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  transition: width 0.3s ease;
}
.left-panel.expanded {
  width: 100%;
}
.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.search-section {
  flex: 1;
}
.search-section :deep(.tiny-input__inner) {
  border-radius: 8px;
  border: 1px solid #e1e5e9;
  background: #ffffff;
  padding: 8px 12px;
}
.search-section :deep(.tiny-input_suffix) {
  display: flex;
  align-items: center;
  margin-right: 8px;
}
.action-section {
  flex-shrink: 0;
}
.model-list {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
.model-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 48px;
}
.model-item:last-child {
  border-bottom: none;
}
.model-item:hover {
  background: linear-gradient(90deg, #f8f9fa 0%, #f0f8ff 100%);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.model-item.active {
  background: linear-gradient(90deg, #e6f7ff 0%, #f0f8ff 100%);
  border-right: 3px solid #1890ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.15);
}
.model-name {
  font-weight: 600;
  color: #262626;
  margin-bottom: 2px;
  font-size: 14px;
}
.model-english-name {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  font-family: monospace;
}
.model-desc {
  font-size: 12px;
  color: #8c8c8c;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.model-actions {
  display: flex;
  gap: 2px;
}
.add-model-btn {
  border-radius: 6px;
  font-weight: 500;
  padding: 0 !important;
}
.empty-tip {
  color: #8c8c8c;
  font-size: 12px;
  text-align: center;
  padding: 24px 12px;
}
</style>
