<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register';
import _metaData from './meta.js';
/* metaService */
import { ref } from 'vue';
const title = ref('Script Setup Component');
const count = ref(0);
const increment = _callEntry(() => {
  count.value++;
}, {
  metaData: {
    id: `${_metaData.id}.increment`
  },
  ctx: () => ({
    title,
    count,
    increment
  })
});</script>
<style>
h1 {
  color: green;
}
</style>
