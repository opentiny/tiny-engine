import {ref} from 'vue';
import {useSchema, useWs, useX6} from '@opentiny/tiny-engine-controller';
export const visible = ref(false);
export const messages = ref([])
export const finish = ref(false);
export const error = ref(false);
export const canDownload = ref(false);
export const downloadFileName = ref('');
export const loading = ref(false);
export const colors = {
  'info': '#1976D2',
  'error': '#D32F2F',
}
const {
  client, 
  onConnect,
  onProgess,
  onFinish,
  onError,
  onDone
} = useWs();
onConnect(()=>{
  messages.value.push([colors.info, 'Connect server success...'])
})
onProgess((message)=>{
  messages.value.push([colors.info, message]);
})
onFinish((message)=>{
  error.value = false;
  finish.value = true;
  loading.value = false;
  messages.value.push([colors.info, message])
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
const {schema, updateSchema} = useSchema();
let g = null;
export const useExport = () => {
    const openDialog = () => {
        if (messages.value.length){
            messages.value = [];
        }
        loading.value = true;
        if (!visible.value){
            visible.value = true;
        }
        if (!g){
            g = useX6().g;
        }
        const edges = g.getEdges();
        updateSchema({
          cells: g.toJSON().cells,
          edges
        })
        client.emitWithAck('createCodeGenerate', schema)
        .catch(() => {
            messages.value.push([colors.error, '服务器超时, 请重试'])
            finish.value = true;
            loading.value = false;
        })
    }
    const retry = () => {
        messages.value = [];
        openDialog();
    }
    return {retry, openDialog};
}
