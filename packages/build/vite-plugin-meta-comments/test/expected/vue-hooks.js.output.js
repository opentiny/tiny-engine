import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register';
import _metaData from './meta.js';
/* metaService */
import { onMounted, onBeforeMount } from 'vue';
export const useHooks = _callEntry(() => {
  onMounted(_callEntry(() => {
    console.log('Component mounted');
  }, {
    metaData: {
      id: `${_metaData.id}.onMounted[0]`
    },
    ctx: () => ({
      useHooks
    })
  }));
  onBeforeMount(_callEntry(() => {
    console.log('Component will mount');
  }, {
    metaData: {
      id: `${_metaData.id}.onBeforeMount[0]`
    },
    ctx: () => ({
      useHooks
    })
  }));
}, {
  metaData: {
    id: `${_metaData.id}.useHooks`
  },
  ctx: () => ({
    useHooks
  })
});