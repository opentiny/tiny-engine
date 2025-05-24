import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register';
import _metaData from './meta.js';
/* metaService: testModule */
import { reactive } from 'vue';
export const useTestService = _callEntry(() => {
  const state = reactive({
    count: 0
  });
  const increment = _callEntry(() => {
    state.count++;
  }, {
    metaData: {
      id: 'testModule.increment'
    },
    ctx: () => ({
      state,
      increment,
      useTestService
    })
  });
  return {
    state,
    increment
  };
}, {
  metaData: {
    id: 'testModule.useTestService'
  },
  ctx: () => ({
    useTestService
  })
});