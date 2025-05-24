import { callEntry as _callEntry, useCompile as _useCompile } from '@opentiny/tiny-engine-meta-register';
import _metaData from './meta.js';
/* metaService */
const arrowFunc = _callEntry(() => {
  console.log('Arrow function');
  return true;
}, {
  metaData: {
    id: `${_metaData.id}.arrowFunc`
  },
  ctx: () => ({
    arrowFunc
  })
});
export { arrowFunc };