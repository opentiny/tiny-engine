import { addMetaComponents } from '@opentiny/tiny-engine-entry'
import MetaInput from './MetaInput.vue'

export default () => {
  addMetaComponents([
    {
      name: 'meta-input-custom',
      component: MetaInput
    }
  ])
}
