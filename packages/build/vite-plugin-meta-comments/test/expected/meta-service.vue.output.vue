<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ state.count }}</button>
  </div>
</template>
<script>import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register';
import _metaData from './meta.js';
/* metaService */
import { reactive, ref } from 'vue';
export default {
  name: 'TestComponent',
  setup() {
    const title = ref('Test Component');
    const state = reactive({
      count: 0
    });
    const increment = _callEntry(() => {
      state.count++;
    }, {
      metaData: {
        id: `${_metaData.id}.increment`
      },
      ctx: () => ({
        title,
        state,
        increment
      })
    });
    return {
      title,
      state,
      increment
    };
  }
};</script>

<style>
h1 {
  color: blue;
}
</style>
