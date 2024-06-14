import { InputConfigurator, SelectConfigurator } from '@opentiny/tiny-engine-configurator'
import MyInputConfigurator from './MyInputConfigurator.vue'

export const configurators = [
  {
    name: 'MyInputConfigurator',
    component: MyInputConfigurator
  },
  InputConfigurator,
  SelectConfigurator
]
