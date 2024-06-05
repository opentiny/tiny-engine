import { register } from '@opentiny/tiny-engine-entry'
import { getMethods } from './js/method'

export const registerVariableConfiguratorList = () => {
  register(
    'VARIABLE_CONFIGURATOR_LIST',
    {
      function: {
        content: '自定义处理函数',
        getVariables: () => {
          return {
            bindPrefix: 'this.',
            variables: { ...getMethods() }
          }
        },
        _order: 300
      }
    },
    { mergeObject: true }
  )
}
