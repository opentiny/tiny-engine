<!--
  Copyright (c) 2023 - present TinyEngine Authors.
  Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.

  Use of this source code is governed by an MIT-style license.

  THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
  BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
  A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
-->
<template>
  <div class="not-found">
    <div class="not-found-content">
      <!-- 404 图标 -->
      <div class="not-found-icon">
        <svg viewBox="0 0 200 200" width="120" height="120">
          <circle cx="100" cy="100" r="80" fill="#f0f0f0" stroke="#ddd" stroke-width="2" />
          <text x="100" y="110" text-anchor="middle" font-size="48" fill="#999">404</text>
        </svg>
      </div>

      <!-- 错误信息 -->
      <div class="not-found-text">
        <h1>页面未找到</h1>
        <p>抱歉，您访问的页面不存在或已被删除。</p>
        <p class="error-details">
          请求的路径: <code>{{ currentPath }}</code>
        </p>
      </div>

      <!-- 操作按钮 -->
      <div class="not-found-actions">
        <button @click="refresh" class="action-button secondary">刷新页面</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 路由和工具
const route = useRoute()

// 计算属性
const currentPath = computed(() => route.path)

const refresh = () => {
  window.location.reload()
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.not-found-icon {
  margin-bottom: 30px;
}

.not-found-text h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 15px;
  font-weight: 300;
}

.not-found-text p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 10px;
  line-height: 1.6;
}

.error-details {
  font-size: 0.9rem;
  color: #999;
  margin-top: 20px;
}

.error-details code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.not-found-actions {
  margin: 30px 0;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.action-button.primary {
  background: #409eff;
  color: white;
}

.action-button.primary:hover {
  background: #66b1ff;
  transform: translateY(-2px);
}

.action-button.secondary {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.action-button.secondary:hover {
  background: #e9e9e9;
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 30px 20px;
  }

  .not-found-text h1 {
    font-size: 2rem;
  }

  .not-found-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-button {
    width: 100%;
    max-width: 200px;
  }
}
</style>
