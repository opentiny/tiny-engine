<script setup>
import {ref} from 'vue';
import { useSchema, useWs } from '@opentiny/tiny-engine-controller'
import {Button as TinyButton, DialogBox} from '@opentiny/vue';
const loading = ref(false);
/**
 * @type {import('vue').Ref<[keyof typeof colors, string]>}
 */
const visible = ref(false);
const messages = ref([])
const finish = ref(false);
const error = ref(false);
const canDownload = ref(false);
const downloadFileName = ref('');
const { schema } = useSchema();
const {
  client, 
  onConnect,
  onProgess,
  onFinish,
  onError,
  onDone
} = useWs();

/**
 * @type {{info: string, error: string}}
 */
const colors = {
  'info': '#1976D2',
  'error': '#D32F2F',
}

onConnect(()=>{
  messages.value.push([colors.info, 'Connect server success...'])
})
onProgess((message)=>{
  messages.value.push([colors.info, message]);
})
onFinish(()=>{
  error.value = false;
  finish.value = true;
  loading.value = false;
})
onError((reason)=>{
  messages.value.push(
    [colors.error, reason]
  );
  finish.value = true;
  error.value = true;
  loading.value = false;
})
onDone((fileName) => {
  downloadFileName.value = fileName;
  canDownload.value = true;
})
const openApi = () => {
  if (messages.value.length){
    messages.value = [];
  }
  loading.value = true;
  if (!visible.value){
    visible.value = true;
  }
  client.emitWithAck('createCodeGenerate', schema)
  .catch(() => {
    messages.value.push([colors.error, '服务器超时, 请重试'])
    finish.value = true;
    loading.value = false;
  })
}
const retry = () => {
  messages.value = [];
  openApi()
}
</script>
<template>
  <tiny-button @click="openApi">
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