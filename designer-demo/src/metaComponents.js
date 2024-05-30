// import { addMetaComponents } from '@opentiny/tiny-engine-entry'
import CustomMetaInput from './MetaInput.vue'
import { MetaInput, MetaSelect } from '@opentiny/tiny-engine-meta-components'

export const metaComponents = [
  {
    name: 'meta-input-custom',
    component: CustomMetaInput
  },
  MetaInput,
  MetaSelect
]
