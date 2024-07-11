import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const variableConfiguratorList = [
  {
    id: 'state',
    content: 'State 属性',
    getVariables: () => ({
      bindPrefix: 'this.state.',
      variables: useCanvas().canvasApi.value.getSchema()?.state
    }),
    _order: 100
  },
  {
    id: 'store',
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
]

export const getSharedOptions = () => ({
  variableConfiguratorList
})
