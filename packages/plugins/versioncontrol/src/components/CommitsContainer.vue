<template>
  <div class="commits-container">
    <div class="commits-header">
      <h3>提交详情</h3>
      <div class="header-controls">
        <div class="view-options">
          <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }" class="view-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            列表
          </button>
          <button @click="viewMode = 'detailed'" :class="{ active: viewMode === 'detailed' }" class="view-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            详细
          </button>
        </div>

        <div class="sort-options">
          <select v-model="sortBy" @change="applySorting" class="sort-select">
            <option value="date-desc">时间 ↓</option>
            <option value="date-asc">时间 ↑</option>
            <option value="author">作者</option>
            <option value="message">消息</option>
          </select>
        </div>
      </div>
    </div>

    <div class="commits-list" :class="viewMode">
      <div
        v-for="commit in paginatedCommits"
        :key="commit.hash"
        class="commit-item"
        :class="{
          selected: selectedCommit?.hash === commit.hash,
          'merge-commit': commit.type === 'merge'
        }"
        @click="selectCommit(commit)"
      >
        <!-- 提交头部信息 -->
        <div class="commit-header">
          <div class="commit-meta">
            <img :src="commit.avatar" alt="avatar" class="commit-avatar" />
            <div class="commit-author-info">
              <div class="commit-author">{{ commit.author }}</div>
              <div class="commit-date">{{ formatDate(commit.date) }}</div>
            </div>
            <div v-if="commit.type === 'merge'" class="merge-badge">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 16l2.879-2.879a3 3 0 0 1 4.242 0L18 16M8 8l2.879 2.879a3 3 0 0 1 4.242 0L18 8" />
              </svg>
              合并
            </div>
          </div>

          <div class="commit-actions">
            <span class="commit-hash">{{ commit.hash.slice(0, 7) }}</span>
            <div class="action-buttons">
              <button @click.stop="showCommitDetails(commit)" class="action-btn small" title="查看详情">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
                </svg>
              </button>
              <button @click.stop="compareCommit(commit)" class="action-btn small" title="比较差异">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 20V10M6 20V4m6 16v-8"></path>
                </svg>
              </button>
              <button @click.stop="revertToCommit(commit)" class="action-btn small danger" title="回滚">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 7v6h6M21 17v-6h-6"></path>
                  <path d="M21 3l-9 9-9-9"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 提交消息 -->
        <div class="commit-message">
          <span class="commit-type-prefix" :class="commit.type">
            {{ getCommitTypePrefix(commit.type) }}
          </span>
          {{ commit.message }}
        </div>

        <!-- 标签和分支信息 -->
        <div v-if="commit.tags?.length || commit.branches?.length" class="commit-labels">
          <span v-for="tag in commit.tags" :key="tag" class="commit-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            </svg>
            {{ tag }}
          </span>
          <span v-for="branch in commit.branches" :key="branch" class="commit-branch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
            </svg>
            {{ branch }}
          </span>
        </div>

        <!-- 详细视图额外信息 -->
        <div v-if="viewMode === 'detailed'" class="commit-details">
          <div class="commit-stats">
            <span class="stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              <span class="stat-value">{{ commit.filesChanged || 0 }} 文件</span>
            </span>
            <span class="stat-item additions">
              <span class="stat-value">+{{ commit.additions || 0 }}</span>
            </span>
            <span class="stat-item deletions">
              <span class="stat-value">-{{ commit.deletions || 0 }}</span>
            </span>
          </div>

          <div v-if="commit.changedFiles?.length" class="commit-files">
            <div class="files-header">变更文件:</div>
            <div class="files-list">
              <div v-for="file in commit.changedFiles.slice(0, 3)" :key="file" class="changed-file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                {{ file }}
              </div>
              <div v-if="commit.changedFiles.length > 3" class="more-files">
                +{{ commit.changedFiles.length - 3 }} 个文件...
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredCommitsLength === 0" class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <h3>未找到匹配的提交</h3>
        <p>尝试调整搜索条件或筛选器</p>
        <button @click="clearFilters" class="clear-btn">清除所有筛选</button>
      </div>
    </div>

    <!-- 分页控制 -->
    <div v-if="filteredCommitsLength > 0" class="pagination-container">
      <button @click="loadMore" :disabled="isLoading || !hasMore" class="load-more-btn">
        <svg v-if="isLoading" class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 12a9 9 0 11-6.219-8.56"></path>
        </svg>
        <span v-if="isLoading">加载中...</span>
        <span v-else-if="hasMore">加载更多 ({{ filteredCommitsLength - paginatedCommits.length }} 个)</span>
        <span v-else>已加载全部</span>
      </button>

      <div class="pagination-info">
        显示 {{ Math.min(currentPage * pageSize, filteredCommitsLength) }} / {{ filteredCommitsLength }} 个提交
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  viewMode: String,
  sortBy: String,
  paginatedCommits: Array,
  selectedCommit: Object,
  filteredCommitsLength: Number,
  isLoading: Boolean,
  hasMore: Boolean,
  currentPage: Number,
  pageSize: Number
})

const emit = defineEmits([
  'update:viewMode',
  'update:sortBy',
  'applySorting',
  'selectCommit',
  'showCommitDetails',
  'compareCommit',
  'revertToCommit',
  'clearFilters',
  'loadMore'
])

const viewMode = computed({
  get: () => props.viewMode,
  set: (value) => emit('update:viewMode', value)
})

const sortBy = computed({
  get: () => props.sortBy,
  set: (value) => emit('update:sortBy', value)
})

const applySorting = () => {
  emit('applySorting')
}

const selectCommit = (commit) => {
  emit('selectCommit', commit)
}

const showCommitDetails = (commit) => {
  emit('showCommitDetails', commit)
}

const compareCommit = (commit) => {
  emit('compareCommit', commit)
}

const revertToCommit = (commit) => {
  emit('revertToCommit', commit)
}

const clearFilters = () => {
  emit('clearFilters')
}

const loadMore = () => {
  emit('loadMore')
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleDateString('zh-CN', options)
}

const getCommitTypePrefix = (type) => {
  const typeMap = {
    feat: '特性',
    fix: '修复',
    docs: '文档',
    style: '样式',
    refactor: '重构',
    perf: '性能',
    test: '测试',
    build: '构建',
    ci: 'CI/CD',
    chore: '杂项',
    revert: '回滚',
    merge: '合并'
  }
  return typeMap[type] || type
}
</script>

<style lang="less">
.commits-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .commits-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    background: white;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #1f2937;
      font-weight: 600;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 16px;

      .view-options {
        display: flex;
        gap: 4px;

        .view-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          background: white;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;

          svg {
            width: 14px;
            height: 14px;
          }

          &:first-child {
            border-radius: 6px 0 0 6px;
          }

          &:last-child {
            border-radius: 0 6px 6px 0;
            border-left: none;
          }

          &.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
          }

          &:hover:not(.active) {
            background: #f3f4f6;
          }
        }
      }

      .sort-options {
        .sort-select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;

          &:focus {
            outline: none;
            border-color: #3b82f6;
          }
        }
      }
    }
  }

  .commits-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px;

    .commit-item {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      &.selected {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      &.merge-commit {
        border-left: 4px solid #8b5cf6;
      }

      .commit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .commit-meta {
          display: flex;
          align-items: center;
          gap: 12px;

          .commit-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 2px solid #e5e7eb;
          }

          .commit-author-info {
            .commit-author {
              font-weight: 600;
              color: #1f2937;
              font-size: 14px;
            }

            .commit-date {
              font-size: 12px;
              color: #6b7280;
            }
          }

          .merge-badge {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #8b5cf6;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;

            svg {
              width: 12px;
              height: 12px;
            }
          }
        }

        .commit-actions {
          display: flex;
          align-items: center;
          gap: 8px;

          .commit-hash {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 12px;
            color: #6b7280;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
          }

          .action-buttons {
            display: flex;
            gap: 4px;

            .action-btn {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              color: #374151;
              cursor: pointer;
              transition: all 0.2s;

              svg {
                width: 14px;
                height: 14px;
              }

              &.danger {
                color: #dc2626;
                border-color: #fca5a5;

                &:hover {
                  background: #fef2f2;
                  border-color: #dc2626;
                }
              }

              &:hover {
                background: #f9fafb;
                border-color: #9ca3af;
                transform: translateY(-1px);
              }
            }
          }
        }
      }

      .commit-message {
        font-size: 14px;
        color: #1f2937;
        margin-bottom: 12px;
        line-height: 1.5;
        display: flex;
        align-items: flex-start;
        gap: 8px;

        .commit-type-prefix {
          font-weight: 600;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          &.feature {
            background: #dcfce7;
            color: #166534;
          }

          &.bugfix {
            background: #fee2e2;
            color: #991b1b;
          }

          &.docs {
            background: #f3f4f6;
            color: #374151;
          }

          &.style {
            background: #fce7f3;
            color: #be185d;
          }

          &.refactor {
            background: #dbeafe;
            color: #1e40af;
          }

          &.test {
            background: #ecfccb;
            color: #365314;
          }

          &.merge {
            background: #ede9fe;
            color: #6b21a8;
          }
        }
      }

      .commit-labels {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;

        .commit-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #fef3c7;
          color: #92400e;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;

          svg {
            width: 12px;
            height: 12px;
          }
        }

        .commit-branch {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;

          svg {
            width: 12px;
            height: 12px;
          }
        }
      }

      .commit-details {
        border-top: 1px solid #f3f4f6;
        padding-top: 12px;
        margin-top: 12px;

        .commit-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;

            svg {
              width: 14px;
              height: 14px;
              color: #6b7280;
            }

            .stat-value {
              font-weight: 600;
            }

            &.additions .stat-value {
              color: #10b981;
            }

            &.deletions .stat-value {
              color: #ef4444;
            }
          }
        }

        .commit-files {
          .files-header {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 6px;
          }

          .files-list {
            .changed-file {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              color: #6b7280;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
              margin-bottom: 2px;

              svg {
                width: 12px;
                height: 12px;
              }
            }

            .more-files {
              font-size: 12px;
              color: #9ca3af;
              font-style: italic;
              margin-top: 4px;
            }
          }
        }
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #6b7280;

      svg {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #374151;
      }

      p {
        margin: 0 0 16px 0;
        font-size: 14px;
      }

      .clear-btn {
        padding: 8px 16px;
        border: 1px solid #3b82f6;
        border-radius: 6px;
        background: #3b82f6;
        color: white;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #2563eb;
        }
      }
    }

    &.detailed .commit-item {
      .commit-details {
        display: block;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    background: white;

    .load-more-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;

      .loading-icon {
        width: 16px;
        height: 16px;
        animation: spin 1s linear infinite;
      }

      &:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .pagination-info {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }
  }
}
</style>
