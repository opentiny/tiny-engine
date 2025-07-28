<template>
  <!-- 提交详情对话框 -->
  <div v-if="modelDialogVisible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog-content" @click.stop>
      <div class="dialog-header">
        <h3>提交详情</h3>
        <button @click="closeDialog" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="dialog-body" v-if="modelSelectedCommit">
        <div class="detail-section">
          <h4>基本信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>作者:</label>
              <div class="author-info">
                <img :src="modelSelectedCommit.avatar" alt="avatar" class="author-avatar" />
                <span>{{ modelSelectedCommit.author }}</span>
              </div>
            </div>
            <div class="detail-item">
              <label>时间:</label>
              <span>{{ formatDate(modelSelectedCommit.date) }}</span>
            </div>
            <div class="detail-item">
              <label>Hash:</label>
              <span class="hash-full">{{ modelSelectedCommit.hash }}</span>
            </div>
            <div class="detail-item">
              <label>类型:</label>
              <span class="commit-type-badge" :class="modelSelectedCommit.type">
                {{ getCommitTypeText(modelSelectedCommit.type) }}
              </span>
            </div>
            <div class="detail-item full-width">
              <label>提交信息:</label>
              <div class="commit-message-full">{{ modelSelectedCommit.message }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="modelSelectedCommit.changedFiles?.length">
          <h4>变更文件 ({{ modelSelectedCommit.changedFiles.length }})</h4>
          <div class="files-list-detailed">
            <div v-for="file in modelSelectedCommit.changedFiles" :key="file" class="file-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
              </svg>
              {{ file }}
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="modelSelectedCommit.tags?.length || modelSelectedCommit.branches?.length">
          <h4>标签和分支</h4>
          <div class="labels-container">
            <div v-if="modelSelectedCommit.tags?.length" class="label-group">
              <span class="label-type">标签:</span>
              <span v-for="tag in modelSelectedCommit.tags" :key="tag" class="label-item tag">{{ tag }}</span>
            </div>
            <div v-if="modelSelectedCommit.branches?.length" class="label-group">
              <span class="label-type">分支:</span>
              <span v-for="branch in modelSelectedCommit.branches" :key="branch" class="label-item branch">{{
                branch
              }}</span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <button @click="compareWithCurrent" class="action-btn primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 20V10M6 20V4m6 16v-8"></path>
            </svg>
            与当前版本比较
          </button>
          <button @click="createBranchFromCommit" class="action-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="6" y1="3" x2="6" y2="15"></line>
              <circle cx="18" cy="6" r="3"></circle>
              <circle cx="6" cy="18" r="3"></circle>
            </svg>
            从此版本创建分支
          </button>
          <button @click="revertToCommit(modelSelectedCommit)" class="action-btn danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 7v6h6M21 17v-6h-6"></path>
              <path d="M21 3l-9 9-9-9"></path>
            </svg>
            回滚到此版本
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    dialogVisible: {
      type: Boolean,
      default: false
    },
    selectedCommit: {
      type: Object,
      default: () => ({})
    }
  },
  emits: [
    'close-dialog',
    'get-commit-type-text',
    'compare-with-current',
    'create-branch-from-commit',
    'revert-to-commit',
    'update:dialogVisible',
    'update:selectedCommit'
  ],
  setup(props, { emit }) {
    // 计算属性
    const modelDialogVisible = computed({
      get: () => props.dialogVisible,
      set: (val) => emit('update:dialogVisible', val)
    })

    const modelSelectedCommit = computed({
      get: () => props.selectedCommit,
      set: (val) => emit('update:selectedCommit', val)
    })

    // 父组件传递的事件
    const closeDialog = () => {
      emit('close-dialog')
    }

    const getCommitTypeText = () => {
      emit('get-commit-type-text')
    }

    const compareWithCurrent = () => {
      emit('compare-with-current')
    }

    const createBranchFromCommit = () => {
      emit('create-branch-from-commit')
    }

    const revertToCommit = (commit) => {
      emit('revert-to-commit', commit)
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    return {
      modelSelectedCommit,
      modelDialogVisible,
      closeDialog,
      getCommitTypeText,
      compareWithCurrent,
      createBranchFromCommit,
      revertToCommit,
      formatDate
    }
  }
}
</script>

<style lang="less" scoped>
// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);

  .dialog-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

    &.small {
      max-width: 400px;
    }

    &.large {
      max-width: 800px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
      background: #fafafa;

      h3 {
        margin: 0;
        font-size: 18px;
        color: #1f2937;
        font-weight: 600;
      }

      .close-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        color: #6b7280;
        border-radius: 6px;
        transition: all 0.2s;

        svg {
          width: 20px;
          height: 20px;
        }

        &:hover {
          color: #374151;
          background: #f3f4f6;
        }
      }
    }

    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;

      .detail-section {
        margin-bottom: 24px;

        &:last-child {
          margin-bottom: 0;
        }

        h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #1f2937;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .detail-grid {
          display: grid;
          gap: 16px;

          .detail-item {
            display: flex;
            gap: 12px;
            align-items: flex-start;

            &.full-width {
              grid-column: 1 / -1;
              flex-direction: column;
              gap: 8px;
            }

            label {
              font-weight: 600;
              color: #374151;
              min-width: 80px;
              font-size: 14px;
            }

            .author-info {
              display: flex;
              align-items: center;
              gap: 8px;

              .author-avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
              }
            }

            .hash-full {
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
              font-size: 12px;
              background: #f3f4f6;
              padding: 6px 10px;
              border-radius: 6px;
              word-break: break-all;
              border: 1px solid #e5e7eb;
            }

            .commit-type-badge {
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
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

            .commit-message-full {
              background: #f9fafb;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              line-height: 1.5;
              font-size: 14px;
            }
          }
        }

        .files-list-detailed {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fafafa;

          .file-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            border-bottom: 1px solid #f3f4f6;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 13px;
            color: #374151;

            svg {
              width: 14px;
              height: 14px;
              color: #6b7280;
            }

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background: #f3f4f6;
            }
          }
        }

        .labels-container {
          .label-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;

            .label-type {
              font-weight: 600;
              color: #374151;
              font-size: 14px;
              min-width: 60px;
            }

            .label-item {
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;

              &.tag {
                background: #fef3c7;
                color: #92400e;
              }

              &.branch {
                background: #dbeafe;
                color: #1e40af;
              }
            }
          }
        }
      }

      .detail-actions {
        display: flex;
        gap: 12px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        flex-wrap: wrap;

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 14px;

          svg {
            width: 16px;
            height: 16px;
          }

          &.primary {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;

            &:hover {
              background: #2563eb;
              transform: translateY(-1px);
            }
          }

          &.danger {
            color: #dc2626;
            border-color: #fca5a5;

            &:hover {
              background: #fef2f2;
              border-color: #dc2626;
              transform: translateY(-1px);
            }
          }

          &:not(.primary):not(.danger) {
            background: white;
            color: #374151;

            &:hover {
              background: #f9fafb;
              border-color: #9ca3af;
              transform: translateY(-1px);
            }
          }
        }
      }

      .form-group {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
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
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;

        .action-btn {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 14px;

          &.secondary {
            background: white;
            color: #374151;

            &:hover {
              background: #f9fafb;
              transform: translateY(-1px);
            }
          }

          &.primary {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;

            &:hover:not(:disabled) {
              background: #2563eb;
              transform: translateY(-1px);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }

      // 比较对话框特殊样式
      .compare-header {
        margin-bottom: 20px;

        .compare-info {
          .compare-item {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;

            label {
              font-weight: 600;
              color: #374151;
              min-width: 80px;
            }

            .version-info {
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
              font-size: 13px;
              color: #6b7280;
            }
          }
        }
      }

      .compare-stats {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;

        .stat-card {
          flex: 1;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;

          .stat-number {
            font-size: 24px;
            font-weight: 700;
            color: #374151;
          }

          .stat-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }

          &.additions {
            border-color: #10b981;
            background: #ecfdf5;

            .stat-number {
              color: #10b981;
            }
          }

          &.deletions {
            border-color: #ef4444;
            background: #fef2f2;

            .stat-number {
              color: #ef4444;
            }
          }
        }
      }

      .compare-files {
        h4 {
          margin-bottom: 12px;
        }

        .files-diff-list {
          .file-diff-item {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            margin-bottom: 8px;
            background: white;

            .file-diff-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px;

              .file-name {
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                font-size: 13px;
                color: #374151;

                svg {
                  width: 14px;
                  height: 14px;
                  color: #6b7280;
                }
              }

              .file-stats {
                display: flex;
                gap: 8px;
                font-size: 12px;
                font-weight: 600;

                .additions {
                  color: #10b981;
                }

                .deletions {
                  color: #ef4444;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
