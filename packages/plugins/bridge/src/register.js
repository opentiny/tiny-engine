import { useResource } from '@opentiny/tiny-engine-controller'
import { register } from '@opentiny/tiny-engine-entry'

export const registerVariableConfiguratorList = () => {
  register(
    'VARIABLE_CONFIGURATOR_LIST',
    {
      utils: {
        content: '工具类',
        getVariables: () => ({
          bindPrefix: 'this.utils.',
          variables: (useResource().resState['utils'] || []).reduce((result, item) => {
            result[item.name] = `utils.${item.content.exportName}`
            return result
          }, {})
        }),
        _order: 400
      },
      bridge: {
        content: '桥接源',
        getVariables: () => ({
          bindPrefix: 'this.bridge.',
          variables: (useResource().resState['bridge'] || []).reduce((result, item) => {
            result[item.name] = `bridge.${item.content.exportName}`
            return result
          }, {})
        }),
        _order: 500
      }
    },
    { mergeObject: true }
  )
}
