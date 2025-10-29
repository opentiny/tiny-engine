<template>
  <!-- 比较差异对话框 -->
  <div v-if="modelCompareDialogVisible" class="dialog-overlay" @click="closeCompareDialog">
    <div class="dialog-content large" @click.stop>
      <div class="dialog-header">
        <h3>版本比较</h3>
        <button @click="closeCompareDialog" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="dialog-body">
        <div class="compare-header">
          <div class="compare-info">
            <div class="compare-item">
              <label>基础版本:</label>
              <span class="version-info">
                {{ modelCompareData.base?.hash?.slice(0, 7) }} - {{ modelCompareData.base?.message }}
              </span>
              <span class="version-info"> 分支 - {{ modelCompareData.base.branches[0] || '未知' }} </span>
            </div>
            <div class="compare-item">
              <label>当前版本:</label>
              <span class="version-info">
                {{ modelCompareData.target?.hash?.slice(0, 7) }} - {{ modelCompareData.target?.message }}
              </span>
              <span class="version-info"> 分支 - {{ modelCompareData.target.branches[0] || '未知' }} </span>
            </div>
          </div>
        </div>

        <div class="compare-stats">
          <div class="stat-card">
            <div class="stat-number">{{ modelCompareData.filesChanged || 0 }}</div>
            <div class="stat-label">文件变更</div>
          </div>
          <div class="stat-card additions">
            <div class="stat-number">+{{ modelCompareData.additions || 0 }}</div>
            <div class="stat-label">新增</div>
          </div>
          <div class="stat-card deletions">
            <div class="stat-number">-{{ modelCompareData.deletions || 0 }}</div>
            <div class="stat-label">删除</div>
          </div>
        </div>

        <div class="compare-files">
          <h4>变更文件列表</h4>
          <div class="files-diff-list">
            <div v-for="file in modelCompareData.changedFiles || []" :key="file.name" class="file-diff-item">
              <div class="file-diff-header">
                <span class="file-name">{{ file.name }}</span>
                <div style="font-size: 12px; color: #6b7280">
                  +{{ file.additions || 0 }} / -{{ file.deletions || 0 }}
                </div>
              </div>
              <div class="file-stats">
                <div class="file-stats">
                  <pre
                    v-if="file.deletions !== undefined"
                    class="deletions"
                    v-text="formatDiffValue(file.deletions, 'del')"
                  ></pre>

                  <pre
                    v-if="file.additions !== undefined"
                    class="additions"
                    v-text="formatDiffValue(file.additions, 'add')"
                  ></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useUtils } from '../composable/useUtils'

export default {
  props: {
    compareDialogVisible: {
      type: Boolean,
      default: false
    },
    compareData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close-compare-dialog', 'update:compareDialogVisible', 'update:compareData'],
  setup(props, { emit }) {
    const { useVModel } = useUtils()
    // 双向绑定
    const modelCompareDialogVisible = useVModel(props, emit, 'compareDialogVisible')
    const modelCompareData = useVModel(props, emit, 'compareData')

    // 父组件传递事件
    const closeCompareDialog = () => emit('close-compare-dialog')

    const formatDiffValue = (data, type) => {
      if (data === null || data === undefined) {
        return type === 'add' ? '空值（null）' : '空对象（null）'
      }

      if (data === 0) {
        return type === 'add' ? '新增空对象' : '删除标记 (0)'
      }

      if (data === '') {
        return type === 'add' ? '空字符串' : '内容已清空'
      }

      if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
        return type === 'add' ? '空对象（新建）' : '空对象（已清空）'
      }

      try {
        if (typeof data === 'string') {
          const str = data.trim()

          // 1. 如果是 diff 格式，直接处理为文本
          if (str.startsWith('@@')) {
            // 尝试解码 URL 编码字符
            try {
              return decodeURIComponent(str)
            } catch {
              return str // 如果解码失败就返回原始
            }
          }

          // 2. 如果是可能的 JSON 字符串
          const firstChar = str[0]
          if (firstChar === '{' || firstChar === '[') {
            const parsed = JSON.parse(str)
            return JSON.stringify(parsed, null, 2)
          }

          // 3. 如果含有 %xx 编码，也尝试解码
          if (/%[0-9A-Fa-f]{2}/.test(str)) {
            try {
              return decodeURIComponent(str)
            } catch {
              return str
            }
          }

          // 4. 普通字符串
          return str
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('formatDiffValue parse error:', err)
        return data
      }

      return JSON.stringify(data, null, 2)
    }

    return {
      modelCompareData,
      modelCompareDialogVisible,
      closeCompareDialog,
      formatDiffValue
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
            border-radius: 10px;
            margin-bottom: 16px;
            background: #ffffff;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
          }

          .file-diff-header {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 16px;
            background: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
            gap: 6px;
          }

          .file-name {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            word-break: break-all;
          }

          .file-stats {
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 14px 16px;
            background: #fff;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
          }

          .file-stats .deletions,
          .file-stats .additions {
            display: block;
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 12px;
            border-radius: 6px;
            padding: 10px 12px;
            overflow-x: auto;
            line-height: 1.4;
            box-shadow: inset 0 0 0 1px #e5e7eb;
          }

          .file-stats .deletions {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            color: #991b1b;
          }

          .file-stats .additions {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            color: #065f46;
          }

          .file-stats .additions:hover,
          .file-stats .deletions:hover {
            background-color: #f3f4f6;
          }

          .file-stats .empty {
            font-style: italic;
            color: #9ca3af;
            background: #f3f4f6;
            border-left-color: #d1d5db !important;
          }
        }
      }
    }
  }
}
</style>
