import {
  CodeConfigurator,
  CollectionConfigurator,
  ColorConfigurator,
  I18nConfigurator,
  InputConfigurator,
  SelectConfigurator,
  VariableConfigurator
} from '@opentiny/tiny-engine-configurator'
import MyInputConfigurator from './MyInputConfigurator.vue'

export const configurators = [
  {
    name: 'MyInputConfigurator',
    component: MyInputConfigurator
  },
  CodeConfigurator,
  CollectionConfigurator,
  ColorConfigurator,
  I18nConfigurator,
  InputConfigurator,
  SelectConfigurator,
  VariableConfigurator
]
