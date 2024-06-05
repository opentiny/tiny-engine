import { useCanvas } from '@opentiny/tiny-engine-controller'
import { register } from '@opentiny/tiny-engine-entry'

export const registerVariableConfiguratorList = () => {
  register(
    'VARIABLE_CONFIGURATOR_LIST',
    {
      state: {
        content: 'State 属性',
        getVariables: () => ({
          bindPrefix: 'this.state.',
          variables: useCanvas().canvasApi.value.getSchema()?.state
        }),
        _order: 100
      },
      store: {
        content: '应用状态',
        getVariables: () => {
          const variables = {}

          const stores = useCanvas().canvasApi.value.getGlobalState()
          stores.forEach(({ id, state: storeState = {}, getters = {} }) => {
            const loadProp = (prop) => {
              const propBinding = `${id}.${prop}`
              variables[propBinding] = propBinding
            }

            Object.keys(storeState).forEach(loadProp)
            Object.keys(getters).forEach(loadProp)
          })

          return {
            bindPrefix: 'this.stores.',
            variables
          }
        },
        _order: 200
      }
    },
    { mergeObject: true }
  )
}
