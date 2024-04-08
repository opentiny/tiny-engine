<script setup lang="ts">
import {
    useState,
    useDebounce,
    useProjects,
    useSearchParam,
    useNotify
} from '@opentiny/tiny-engine-controller';
import {Input as TinyInput, Loading} from '@opentiny/vue';
import {ref,watch} from 'vue';

const vLoading = Loading.directive
const state = useState();
const projectName = ref(state.name.value);
watch(state.name, ()=>{
    projectName.value = state.name.value;
}, {immediate: true})
const {rename} = useProjects();
const id = useSearchParam(window.location.search).get('projectId');

const onBlur = useDebounce(() => {
    if (projectName.value === state.name.value){
        return;
    }
    if (!projectName.value.length){
        projectName.value = state.name.value;
        useNotify({message: '名称不能为空', title: '警告', type: 'warning'})
        return;
    }
    state.renameLoading.value = true;
    rename(id, projectName.value)
    .then(()=>{
        useNotify({message: '改名成功', type: 'success'})
        state.name.value = projectName.value;
    })
    .catch((reason)=>{
        useNotify({title: '改名失败', message: reason, type: 'error'})
    })
    .finally(()=>{
        state.renameLoading.value = false;
    })
}, 500)

</script>
<template>
    <tiny-input 
        class="rename-input"
        v-model="projectName"
        @blur="onBlur"
        v-loading="state.renameLoading.value"
    />
</template>

<style scoped lang="less">
.rename-input {
    max-width: 320px;
    margin: auto;
    :deep(input){
        text-align: center;
    }
}
</style>