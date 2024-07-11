import { useCanvas } from '@opentiny/tiny-engine-meta-register'

const variableConfiguratorList = [
  {
    id: 'props',
    content: 'props',
    condition: () => useCanvas().isBlock(),
    getVariables: () => {
      const properties = useCanvas().canvasApi.value.getSchema()?.schema?.properties
      const bindProperties = {}
      properties?.forEach(({ content }) => {
        content.forEach(({ property }) => {
          bindProperties[property] = property
        })
      })

      return {
        bindPrefix: 'this.props.',
        variables: bindProperties
      }
    },
    _order: 700
  }
]

export const getSharedOptions = () => ({
  variableConfiguratorList
})
