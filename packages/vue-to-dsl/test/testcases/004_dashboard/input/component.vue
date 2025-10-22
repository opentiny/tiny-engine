<template>
  <div class="dashboard-page">
    <!-- 顶部步骤时间线 -->
    <tiny-time-line :horizontal="true" :active="state.activeStep" :data="state.steps" style="margin-bottom: 12px" />

    <!-- 筛选区 -->
    <div class="panel" style="margin-bottom: 12px">
      <h3 class="panel-title">筛选</h3>
      <tiny-form label-width="80px" label-position="left" :inline="true">
        <tiny-form-item label="关键词">
          <tiny-search v-model="state.filters.keyword" placeholder="请输入关键词" />
        </tiny-form-item>
        <tiny-form-item label="模块">
          <tiny-select v-model="state.filters.module" :options="state.modules" placeholder="请选择模块" />
        </tiny-form-item>
        <tiny-form-item label="分类">
          <tiny-button-group v-model="state.category" :data="state.categories" />
        </tiny-form-item>
        <tiny-form-item>
          <tiny-button type="primary" @click="onSearch">搜索</tiny-button>
          <tiny-button style="margin-left: 8px" @click="onReset">重置</tiny-button>
        </tiny-form-item>
      </tiny-form>
    </div>

    <tiny-row>
      <tiny-col :span="12">
        <div class="panel">
          <h3 class="panel-title">快速入口</h3>
          <tiny-grid :columns="state.columns" :data="state.quickLinks" :auto-resize="true"></tiny-grid>
        </div>
      </tiny-col>
      <tiny-col :span="12">
        <div class="panel">
          <h3 class="panel-title">待办事项</h3>
          <tiny-grid :columns="state.todoCols" :data="state.todos" :auto-resize="true"></tiny-grid>
        </div>
      </tiny-col>
    </tiny-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const state = reactive({
  activeStep: 1,
  filters: { keyword: '', module: '' },
  category: 'all',
  steps: [{ name: '准备' }, { name: '处理' }, { name: '完成' }],
  columns: [
    { field: 'name', title: '名称' },
    { field: 'path', title: '路径' }
  ],
  quickLinks: [
    { id: 1, name: '用户管理', path: '/users' },
    { id: 2, name: '订单管理', path: '/orders' }
  ],
  modules: [
    { value: 'user', label: '用户' },
    { value: 'order', label: '订单' },
    { value: 'report', label: '报表' }
  ],
  categories: [
    { text: '全部', value: 'all' },
    { text: '常用', value: 'fav' },
    { text: '最近', value: 'recent' }
  ],
  todoCols: [
    { field: 'title', title: '标题' },
    { field: 'deadline', title: '截止时间' }
  ],
  todos: [
    { id: 1, title: '修复登录问题', deadline: '2025-09-30' },
    { id: 2, title: '升级依赖', deadline: '2025-10-10' }
  ]
})

function onSearch() {
  console.log('search with', state.filters, state.category)
}
function onReset() {
  state.filters.keyword = ''
  state.filters.module = ''
  state.category = 'all'
}

function go(item) {
  console.log('go to', item.path)
}
</script>

<style scoped>
.dashboard-page {
  padding: 16px;
}

.panel {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: #fff;
}

.panel-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.quick-link-tile {
  height: 80px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-link-tile:hover {
  background: #f0f6ff;
  border-color: #cfe0ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.quick-link-text {
  color: #1f2329;
  font-size: 14px;
  font-weight: 500;
}
</style>
