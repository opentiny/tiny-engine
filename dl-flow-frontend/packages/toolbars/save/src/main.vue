<script setup lang="ts">
import { Button } from '@opentiny/vue';
import { useState } from '@opentiny/tiny-engine-controller';
import {saveSchema} from './api';

const state = useState();


</script>
<template>
    <Button @click="saveSchema" :loading="state.loading.value">
        保存
    </Button>
</template>


<style scoped></style>