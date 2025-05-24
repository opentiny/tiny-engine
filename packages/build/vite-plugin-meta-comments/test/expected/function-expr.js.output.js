import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register';
import _metaData from './meta.js';
/* metaService */
const doSomething = _callEntry(function () {
  console.log('Doing something');
  return true;
}, {
  metaData: {
    id: `${_metaData.id}.doSomething`
  },
  ctx: () => ({
    doSomething
  })
});
export { doSomething };