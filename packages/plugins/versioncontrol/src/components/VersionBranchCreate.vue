<template>
  <!-- 新建分支对话框 -->
  <div v-if="modelBranchDialogVisible" class="dialog-overlay" @click="closeBranchDialog">
    <div class="dialog-content small" @click.stop>
      <div class="dialog-header">
        <h3>新建分支</h3>
        <button @click="closeBranchDialog" class="close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>分支名称:</label>
          <input
            v-model="modelNewBranchName"
            placeholder="例如: feature/my-new-feature"
            class="form-input"
            @keyup.enter="confirmCreateBranch"
          />
        </div>
        <div class="form-group">
          <label>基于提交 (可选):</label>
          <select v-model="modelBranchTargetCommit" class="form-select">
            <option value="">选择提交 (默认为当前分支最新提交)</option>
            <option v-for="commit in commits.slice(0, 10)" :key="commit.hash" :value="commit.hash">
              {{ commit.hash.slice(0, 7) }} - {{ commit.message.slice(0, 50) }}
            </option>
          </select>
        </div>

        <div class="dialog-actions">
          <button @click="closeBranchDialog" class="action-btn secondary">取消</button>
          <button @click="confirmCreateBranch" class="action-btn primary" :disabled="!modelNewBranchName.trim()">
            新建分支
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  branchDialogVisible: {
    type: Boolean,
    default: false
  },
  newBranchName: {
    type: String,
    default: ''
  },
  branchTargetCommit: {
    type: String,
    default: ''
  },
  commits: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:branchDialogVisible',
  'update:newBranchName',
  'update:branchTargetCommit',
  'close-branch-dialog',
  'confirm-create-branch'
])

const modelBranchDialogVisible = computed({
  get: () => props.branchDialogVisible,
  set: (val) => emit('update:branchDialogVisible', val)
})

const modelNewBranchName = computed({
  get: () => props.newBranchName,
  set: (val) => emit('update:newBranchName', val)
})

const modelBranchTargetCommit = computed({
  get: () => props.branchTargetCommit,
  set: (val) => emit('update:branchTargetCommit', val)
})

const closeBranchDialog = () => {
  emit('close-branch-dialog')
}

const confirmCreateBranch = () => {
  emit('confirm-create-branch')
}
</script>

<style lang="less" scoped>
// 对话框样式 (与 version-tag-create.vue 共享，或根据需要独立定义)
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
    }
  }
}
</style>
