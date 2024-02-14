<script setup>
import {ref} from 'vue';
import { useSchema, useWs, useX6 } from '@opentiny/tiny-engine-controller'
import {Button as TinyButton, DialogBox} from '@opentiny/vue';
/**
 * @type {import('vue').Ref<[keyof typeof colors, string]>}
 */
const visible = ref(false);
const messages = ref([])
const finish = ref(false);
const { schema } = useSchema();
const {
  client, 
  onConnect,
  onProgess,
  onFinish,
  onError
} = useWs();

/**
 * @type {{info: string, error: string}}
 */
const colors = {
  'info': '#1976D2',
  'error': '#D32F2F',
}

onConnect(()=>{
  messages.value.push('Connect server success...')
})
onProgess((message)=>{
  messages.value.push([colors.info, message]);
})
onFinish(()=>{
  finish.value = true;
})
onError((reason)=>{
  messages.value.push(
    [colors.error, reason]
  );
  finish.value = true;
})

const openApi = () => {
  visible.value = true;
  const {g} = useX6();
  schema.payload.edges = g.getEdges();
  client.emit('createCodeGenerate', schema);
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
      <tiny-button @click="visible=false">
        关闭
      </tiny-button>
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