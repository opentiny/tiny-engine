<template>
  <div class="merge-dialog-overlay" v-if="mergeBranchVisible">
    <div class="merge-dialog-container">
      <h2 class="dialog-title">合并分支</h2>

      <form @submit.prevent="handleMerge" v-if="!showConflictResolution">
        <div class="form-group">
          <label for="sourceBranch" class="form-label">源分支:</label>
          <select id="sourceBranch" v-model="form.sourceBranchId" required class="form-select">
            <option value="">请选择源分支</option>
            <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
          <p v-if="errors.sourceBranchId" class="error-message">{{ errors.sourceBranchId }}</p>
        </div>

        <div class="form-group">
          <label for="targetBranch" class="form-label">目标分支:</label>
          <select id="targetBranch" v-model="form.targetBranchId" required class="form-select">
            <option value="">请选择目标分支</option>
            <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">
              {{ branch.name }}
            </option>
          </select>
          <p v-if="errors.targetBranchId" class="error-message">{{ errors.targetBranchId }}</p>
        </div>

        <div class="form-group">
          <label for="commitMessage" class="form-label">合并提交信息 (可选):</label>
          <textarea id="commitMessage" v-model="form.commitMessage" class="form-textarea"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="isLoading" class="submit-button">
            {{ isLoading ? '合并中...' : '开始合并' }}
          </button>
          <button type="button" @click="closeDialog" :disabled="isLoading" class="cancel-button">取消</button>
        </div>

        <p v-if="errorMessage" class="error-message form-status-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message form-status-message">{{ successMessage }}</p>
      </form>

      <div v-if="showConflictResolution" class="conflict-resolution-section">
        <h3>发现冲突，请解决:</h3>
        <div v-for="(conflict, index) in conflicts" :key="index" class="conflict-item">
          <div class="conflict-header">
            <h4>文件: {{ conflict.filePath }}</h4>
            <p>冲突类型: {{ conflict.conflictType }}</p>
          </div>
          <div class="conflict-content">
            <div class="conflict-side">
              <h5>你的更改 (Target Branch)</h5>
              <pre>{{ JSON.stringify(conflict.targetValue, null, 2) }}</pre>
              <button @click="resolveConflict(conflict, 'target')">保留我的更改</button>
            </div>
            <div class="conflict-side">
              <h5>对方的更改 (Source Branch)</h5>
              <pre>{{ JSON.stringify(conflict.sourceValue, null, 2) }}</pre>
              <button @click="resolveConflict(conflict, 'source')">接受对方的更改</button>
            </div>
            <div class="conflict-side">
              <h5>共同祖先 (Base)</h5>
              <pre>{{ JSON.stringify(conflict.baseValue, null, 2) }}</pre>
            </div>
          </div>
          <div class="manual-resolve">
            <h5>手动解决 (编辑合并后的内容):</h5>
            <textarea v-model="conflict.resolvedValue" class="manual-textarea"></textarea>
            <button @click="resolveConflict(conflict, 'manual')">确认手动解决</button>
          </div>
        </div>
        <div class="form-actions">
          <button @click="submitResolvedConflicts" :disabled="isLoading" class="submit-button">
            {{ isLoading ? '提交解决...' : '提交已解决冲突' }}
          </button>
          <button type="button" @click="closeDialog" :disabled="isLoading" class="cancel-button">取消</button>
        </div>
        <p v-if="errorMessage" class="error-message form-status-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message form-status-message">{{ successMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    mergeBranchVisible: {
      type: Boolean,
      disabled: true
    }
  },
  emits: []
}
</script>

<style scoped>
.merge-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.merge-dialog-container {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px; /* 增加最大宽度以适应冲突解决界面 */
  font-family: 'Arial', sans-serif;
  position: relative;
  max-height: 90vh; /* 限制最大高度 */
  overflow-y: auto; /* 允许滚动 */
}

.dialog-title {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
  font-size: 24px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #444;
  font-weight: bold;
  font-size: 14px;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #b0b0b0;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 14px;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.form-select:focus,
.form-textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
  outline: none;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.submit-button,
.cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.3s ease, opacity 0.3s ease;
}

.submit-button {
  background-color: #007bff;
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.cancel-button:hover:not(:disabled) {
  background-color: #5a6268;
}

.submit-button:disabled,
.cancel-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 6px;
}

.success-message {
  color: #28a745;
  font-size: 0.85em;
  margin-top: 10px;
  text-align: center;
}

.form-status-message {
  padding: 8px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: center;
  font-weight: 500;
}

.error-message.form-status-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.success-message.form-status-message {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

/* 冲突解决部分样式 */
.conflict-resolution-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.conflict-resolution-section h3 {
  color: #d9534f;
  text-align: center;
  margin-bottom: 20px;
}

.conflict-item {
  border: 1px solid #f0ad4e;
  border-radius: 6px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fffaf0;
}

.conflict-header {
  margin-bottom: 15px;
}

.conflict-header h4 {
  color: #333;
  margin-bottom: 5px;
}

.conflict-header p {
  color: #666;
  font-size: 0.9em;
}

.conflict-content {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap; /* 允许换行 */
}

.conflict-side {
  flex: 1; /* 均分空间 */
  min-width: 200px; /* 最小宽度 */
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
}

.conflict-side h5 {
  margin-top: 0;
  color: #5cb85c; /* Target */
}

.conflict-side:nth-child(2) h5 {
  color: #f0ad4e; /* Source */
}

.conflict-side:nth-child(3) h5 {
  color: #5bc0de; /* Base */
}

.conflict-side pre {
  background-color: #eee;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap; /* 自动换行 */
  word-break: break-all; /* 单词内断行 */
  flex-grow: 1; /* 填充剩余空间 */
  margin-bottom: 10px;
}

.conflict-side button {
  width: 100%;
  padding: 8px 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.conflict-side button:hover {
  background-color: #0056b3;
}

.manual-resolve {
  margin-top: 15px;
  border-top: 1px dashed #ccc;
  padding-top: 15px;
}

.manual-resolve h5 {
  margin-bottom: 10px;
  color: #333;
}

.manual-textarea {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #b0b0b0;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 14px;
  font-family: monospace; /* 等宽字体便于代码查看 */
  resize: vertical;
}

.manual-resolve button {
  margin-top: 10px;
  width: auto;
  padding: 8px 15px;
  background-color: #28a745;
}

.manual-resolve button:hover {
  background-color: #218838;
}
</style>
