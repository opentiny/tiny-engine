<script setup lang="ts">
import { Button, Notify } from '@opentiny/vue';
import { useSearchParam, useState, useX6 } from '@opentiny/tiny-engine-controller';
import {useSchema,useProjects} from '@opentiny/tiny-engine-controller';

const state = useState();
const {save} = useProjects();
const {schema} = useSchema();
const saveSchema = () => {
    const graphData = useX6().g.toJSON();
    let timer = setTimeout(() => {
        state.loading.value = true;
    }, 500);
    const id = useSearchParam(window.location.search).get('projectId');
    save(id, schema, graphData)
        .then(()=>{
            Notify({
                type: 'success',
                message: '保存成功'
            })
        })
        .catch((reason)=>{
            Notify({
                type: 'error',
                message: `保存失败: ${reason}`
            })
        })
        .finally(()=>{
            clearTimeout(timer)
            state.loading.value = false;
        })
}

</script>
<template>
    <Button @click="saveSchema" :loading="state.loading.value">
        保存
    </Button>
</template>


<style scoped></style>