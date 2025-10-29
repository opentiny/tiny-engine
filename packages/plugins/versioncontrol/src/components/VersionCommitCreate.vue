<template>
  <div class="commit-dialog-overlay" v-if="modelCommitDialogVisible" @click="closeCommitDialog">
    <div class="commit-dialog-container" @click.stop>
      <h2 class="dialog-title">创建新提交</h2>
      <form @submit.prevent="handleSubmit" class="commit-form">
        <div class="form-group">
          <label for="branchId" class="form-label">分支ID:</label>
          <select id="branchId" v-model="branchId" required class="form-select">
            <option value="">请选择分支</option>
            <option v-for="branch in modelAvailableBranches" :key="branch.id" :value="branch.id">
              {{ branch.name }} (ID: {{ branch.id }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="message" class="form-label">提交信息:</label>
          <textarea id="message" v-model="message" required class="form-textarea"></textarea>
        </div>

        <commit-category-select v-model="selectedOptions" placeholder="请选择多个选项" />

        <div class="form-actions">
          <button type="submit" :disabled="isLoading" class="submit-button">
            {{ isLoading ? '提交中...' : '创建提交' }}
          </button>
          <button type="button" @click="closeCommitDialog" :disabled="isLoading" class="cancel-button">取消</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive } from 'vue'
import { useUtils } from '../composable/useUtils'
import { versionManager } from '../js'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import CommitCategorySelect from './CommitCategorySelect.vue'

const { reactiveObj2String: obj2String, string2Obj } = utils

export default {
  components: {
    CommitCategorySelect
  },
  props: {
    commitDialogVisible: {
      type: Boolean,
      default: false
    },
    availableBranches: {
      type: Array,
      default: () => {}
    },
    commits: {
      type: Array,
      default: () => {}
    }
  },
  emits: ['update:commitDialogVisible', 'update:availableBranches', 'update:commits', 'close-commit-dialog'],
  setup(props, { emit }) {
    const { useVModel, transformCommit } = useUtils()
    const { pageState } = useCanvas()
    const state = reactive({
      pageShema: string2Obj(useCanvas().exportSchema()),
      pageData: obj2String(pageState.pageSchema)
    })

    const message = ref('')
    const branchId = ref('')
    const isLoading = ref(false)
    const selectedOptions = ref([])
    const modelCommitDialogVisible = useVModel(props, emit, 'commitDialogVisible')
    const modelAvailableBranches = useVModel(props, emit, 'availableBranches')
    const modelCommits = useVModel(props, emit, 'commits')

    // 模拟当前登录用户
    const currentUser = {
      id: 'user-456',
      username: 'commit_user',
      email: 'commit@example.com',
      avatar: 'https://avatars.githubusercontent.com/u/3?v=4'
    }

    // 获取分支列表
    const fetchAvailableBranches = async () => {
      try {
        modelAvailableBranches.value = await versionManager.branchRepository.findAll()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('获取可用分支失败:', error)
      }
    }

    const closeCommitDialog = () => {
      isLoading.value = false
      emit('close-commit-dialog')
    }

    const handleSubmit = async () => {
      isLoading.value = true

      try {
        await versionManager.commitAppService.createCommit(
          branchId.value,
          message.value,
          currentUser,
          string2Obj(useCanvas().exportSchema()),
          selectedOptions.value[0].value
        )
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('创建提交失败:', err)
      } finally {
        isLoading.value = false
        branchId.value = ''
        message.value = ''
        selectedOptions.value = []
        closeCommitDialog()
        const rawCommits = await versionManager.commitRepository.findAll()
        modelCommits.value = await Promise.all(rawCommits.map(transformCommit))
      }
    }

    onMounted(() => {
      fetchAvailableBranches()
    })

    return {
      state,
      isLoading,
      branchId,
      message,
      selectedOptions,
      modelCommitDialogVisible,
      modelAvailableBranches,
      handleSubmit,
      closeCommitDialog,
      options: {
        language: 'json',
        readOnly: true,
        minimap: {
          enabled: false
        }
      }
    }
  }
}
</script>

<style scoped lang="less">
.commit-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
  animation: fadeIn 0.25s ease-out;

  .commit-dialog-container {
    background: linear-gradient(145deg, #ffffff, #f9fafb);
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 8px 40px rgba(0, 0, 0, 0.08);
    width: 90%;
    max-width: 640px;
    font-family: 'Segoe UI', 'Arial', sans-serif;
    position: relative;
    transform: translateY(10px);
    animation: slideUp 0.3s ease-out forwards;

    .dialog-title {
      text-align: center;
      color: #1f2937;
      margin-bottom: 25px;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .commit-form {
      display: flex;
      flex-direction: column;
      gap: 18px;

      .form-group {
        margin-bottom: 8px;

        .form-label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 600;
          font-size: 14px;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          box-sizing: border-box;
          font-size: 14px;
          transition: all 0.25s ease;
          background-color: #ffffff;

          &:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
            outline: none;
          }
        }

        .form-schema {
          min-height: 0;
          height: 100% !important;
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          overflow: hidden;
        }

        .form-textarea {
          resize: none;
          min-height: 110px;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 22px;

        .submit-button,
        .cancel-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.25s ease;

          &:disabled {
            background-color: #e5e7eb;
            color: #9ca3af;
            cursor: not-allowed;
            opacity: 0.8;
          }
        }

        .submit-button {
          background-color: #2563eb;
          color: white;

          &:hover:not(:disabled) {
            background-color: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
          }
        }

        .cancel-button {
          background-color: #6b7280;
          color: white;

          &:hover:not(:disabled) {
            background-color: #4b5563;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(107, 114, 128, 0.2);
          }
        }
      }

      .error-message {
        color: #dc2626;
        font-size: 0.85em;
        margin-top: 6px;

        &.form-status-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          padding: 8px;
          border-radius: 4px;
          margin-top: 15px;
          text-align: center;
          font-weight: 500;
        }
      }

      .success-message {
        color: #16a34a;
        font-size: 0.85em;
        margin-top: 10px;
        text-align: center;

        &.form-status-message {
          background-color: #dcfce7;
          border: 1px solid #bbf7d0;
          padding: 8px;
          border-radius: 4px;
          margin-top: 15px;
          font-weight: 500;
        }
      }
    }
  }
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
  }
  to {
    transform: translateY(0);
  }
}
</style>
