<template>
  <div class="filters-container">
    <div class="filter-group">
      <label>作者:</label>
      <select v-model="modelAuthorFilter" @change="applyFilters" class="filter-select">
        <option value="">全部</option>
        <option v-for="author in uniqueAuthors" :key="author" :value="author">
          {{ author }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label>时间范围:</label>
      <select v-model="modelTimeFilter" @change="applyFilters" class="filter-select">
        <option value="">全部</option>
        <option value="today">今天</option>
        <option value="week">本周</option>
        <option value="month">本月</option>
      </select>
    </div>

    <div class="filter-group">
      <button @click="clearFilters" class="clear-filters-btn">清除筛选</button>
    </div>

    <div class="filter-group">
      <button @click="createCommit" class="commit-btn">提交Commit</button>
    </div>

    <div class="filter-group stats">
      <span class="stats-text"> 共 {{ filteredCommitsLength }} 个提交 | {{ uniqueAuthorsLength }} 位贡献者 </span>
    </div>
  </div>
</template>

<script>
import { useUtils } from '../composable/useUtils'

export default {
  props: {
    authorFilter: {
      type: String,
      default: ''
    },
    timeFilter: {
      type: String,
      default: ''
    },
    uniqueAuthors: {
      type: Array,
      default: () => []
    },
    filteredCommitsLength: {
      type: Number,
      default: 0
    },
    uniqueAuthorsLength: {
      type: Number,
      default: 0
    }
  },
  emits: ['update:authorFilter', 'update:timeFilter', 'applyFilters', 'clearFilters', 'createCommit'],
  setup(props, { emit }) {
    const { useVModel } = useUtils()
    // 双向绑定
    const modelAuthorFilter = useVModel(props, emit, 'authorFilter')
    const modelTimeFilter = useVModel(props, emit, 'timeFilter')

    // 事件方法
    const applyFilters = () => emit('applyFilters')
    const clearFilters = () => emit('clearFilters')
    const createCommit = () => emit('createCommit')

    return {
      modelAuthorFilter,
      modelTimeFilter,
      applyFilters,
      clearFilters,
      createCommit
    }
  }
}
</script>

<style lang="less">
.filters-container {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;

  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
      white-space: nowrap;
    }

    .filter-select {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #3b82f6;
      }

      &:hover {
        border-color: #9ca3af;
      }
    }

    .clear-filters-btn {
      padding: 6px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #6b7280;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #374151;
      }
    }

    .commit-btn {
      padding: 6px 12px;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      background: #3b82f6;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #2563eb;
        border-color: #2563eb;
      }
    }

    &.stats {
      margin-left: auto;

      .stats-text {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }
    }
  }
}
</style>
