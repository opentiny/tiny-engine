<script setup lang="ts">
import { Button, Notify } from '@opentiny/vue';
import { useSearchParam, useState } from '@opentiny/tiny-engine-controller';
import {useSchema,useProjects} from '@opentiny/tiny-engine-controller';

const state = useState();
const {save} = useProjects();
const {schema} = useSchema();

const saveSchema = () => {
    let timer = setTimeout(() => {
        state.saving = true;
    }, 500);
    const id = useSearchParam(window.location.search).get('projectId');
    save(id, schema)
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
            state.saving = false;
        })
}

</script>
<template>
    <Button @click="saveSchema" :loading="state.saving">
        保存
    </Button>
</template>


<style scoped></style>