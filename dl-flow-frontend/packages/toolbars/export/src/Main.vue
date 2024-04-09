<script setup>
import {
  useExport,
  visible,
  messages,
  error,
  downloadFileName,
  loading,
} from './api';
import {Button as TinyButton, DialogBox} from '@opentiny/vue';
const {
  retry,
  openDialog,
} = useExport();
</script>
<template>
  <tiny-button @click="openDialog">
    导出
  </tiny-button>
  <dialog-box v-model:visible="visible" append-to-body>
    <template #title>
      Work in progress
    </template>
    <div class="messages">
      <p v-for="(msg,idx) of messages" :key="idx" :style="{
        color: msg[0]
      }">
        {{msg[1]}}
    </p>
    </div>
    <template #footer>
      <div style="display: flex;flex-direction: row; justify-content: center; margin: auto; align-items: center; gap: 1em;">
        <a v-if="downloadFileName" :href="`/endpoint/code-generate/${downloadFileName}`" download>
          <tiny-button type="text">
            下载
          </tiny-button>
        </a>
        <tiny-button v-if="error" @click="retry" type="primary" :loading="loading">
          重试
        </tiny-button>
        <tiny-button @click="visible=false">
          关闭
        </tiny-button>
      </div>
    </template>
  </dialog-box>
</template>

<style scoped lang="less">
.messages {
  max-height: 300px;
  padding: 1em;
  background: #fdf7d6;
  overflow: auto;
  p {
    margin: 4px;
  }
}
</style>