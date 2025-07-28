<template>
  <header class="version-control-header">
    <div class="header-left">
      <span class="title">版本控制</span>
      <link-button :href="docsUrl" class="link-button"></link-button>
    </div>

    <div class="header-center">
      <!-- 分支选择器 -->
      <div class="branch-selector">
        <select v-model="modelCurrentBranch" @change="onBranchChange" class="branch-select">
          <option v-for="branch in propsBranches" :key="branch" :value="branch">
            {{ branch }}
          </option>
        </select>
      </div>

      <!-- 搜索框 -->
      <div class="search-container">
        <input
          v-model="modelSearchQuery"
          @input="onSearch"
          placeholder="搜索提交信息、作者或Hash..."
          class="search-input"
        />
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
    </div>

    <div class="header-right">
      <!-- 操作按钮 -->
      <button @click="createTag" class="action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        标签
      </button>
      <button @click="createBranch" class="action-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="6" y1="3" x2="6" y2="15"></line>
          <circle cx="18" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="m18 9a9 9 0 0 1-9 9"></path>
        </svg>
        分支
      </button>
      <close-icon @close="close"></close-icon>
    </div>
  </header>
</template>

<script>
import { LinkButton, CloseIcon } from '@opentiny/tiny-engine-common'
import { useHelp } from '@opentiny/tiny-engine-meta-register'
import { computed } from 'vue'

export default {
  components: {
    LinkButton,
    CloseIcon
  },
  props: {
    branches: {
      type: Array,
      default: () => []
    },
    currentBranch: {
      type: String,
      default: 'main'
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: [
    'close',
    'branch-change',
    'search',
    'createTag',
    'createBranch',
    'update:currentBranch',
    'update:searchQuery'
  ],
  setup(props, { emit }) {
    const docsUrl = useHelp().getDocsUrl('script')

    // 计算属性
    const modelCurrentBranch = computed({
      get: () => props.currentBranch,
      set: (val) => emit('update:currentBranch', val)
    })
    const modelSearchQuery = computed({
      get: () => props.searchQuery,
      set: (val) => emit('update:searchQuery', val)
    })

    // 父组件事件
    const close = () => emit('close')
    const onBranchChange = () => emit('branch-change')
    const onSearch = () => emit('search')
    const createTag = () => emit('createTag')
    const createBranch = () => emit('createBranch')

    return {
      propsBranches: props.branches,
      modelCurrentBranch,
      modelSearchQuery,
      docsUrl,
      close,
      onBranchChange,
      onSearch,
      createTag,
      createBranch
    }
  }
}
</script>

<style lang="less" scoped>
.version-control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--ti-lowcode-plugin-version-control-head-border-bottom-color, #e5e7eb);
  padding: 12px 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  min-height: 60px;

  .header-left {
    display: flex;
    align-items: center;

    .title {
      color: var(--ti-lowcode-plugin-panel-title-color, #1f2937);
      font-weight: var(--ti-lowcode-plugin-panel-title-font-weight, 600);
      font-size: 16px;
    }

    .link-button {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin-left: 8px;
      cursor: pointer;
      color: var(--ti-lowcode-plugin-version-control-help-link-color, #6b7280);
      transition: color 0.2s;
      &:hover {
        color: #3b82f6;
      }
    }
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    justify-content: center;

    .branch-selector {
      .branch-select {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        background: white;
        font-size: 14px;
        min-width: 140px;
        cursor: pointer;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &:hover {
          border-color: #9ca3af;
        }
      }
    }

    .search-container {
      position: relative;

      .search-input {
        padding: 8px 12px 8px 40px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        width: 320px;
        font-size: 14px;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        &:hover {
          border-color: #9ca3af;
        }

        &::placeholder {
          color: #9ca3af;
        }
      }

      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        color: #6b7280;
        pointer-events: none;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      svg {
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: #f9fafb;
        border-color: #9ca3af;
        transform: translateY(-1px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

// 响应式设计
@media (max-width: 900px) {
  .version-control-header {
    .header-center {
      .search-container .search-input {
        width: 250px;
      }
    }
  }
}

@media (max-width) {
  .version-control-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;

    .header-center {
      justify-content: space-between;

      .search-container .search-input {
        width: 200px;
      }
    }
  }
}
</style>
