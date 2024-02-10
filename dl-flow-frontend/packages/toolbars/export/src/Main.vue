<template>
  <tiny-button @click="openApi">
    导出
  </tiny-button>
</template>

<script setup>
import {ref} from 'vue';
import { useSchema, useWs } from '@opentiny/tiny-engine-controller'
import {Button as TinyButton} from '@opentiny/vue';
const messages = ref([])
const finish = ref(false);
const { schema } = useSchema();
const { 
  socket,
  onConnect,
  onProgess,
  onFinish,
  onError
} = useWs();

onConnect(()=>{
  messages.value.push('Connect server success...')
})
onProgess((message)=>{
  messages.value.push(message);
})
onFinish(()=>{
  finish.value = true;
})
onError((reason)=>{
  messages.value.push(reason);
  finish.value = true;
})

const openApi = () => {
  console.log(schema);
  // if (!socket.value){
  //   socket.value.emitWithAck('createCodeGenerate', schema)
  // }
}
</script>