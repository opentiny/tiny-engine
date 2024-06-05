import { useCanvas } from '@opentiny/tiny-engine-controller'
import { register } from '@opentiny/tiny-engine-entry'

export const registerVariableConfiguratorList = () => {
  register(
    'VARIABLE_CONFIGURATOR_LIST',
    {
      props: {
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
    },
    { mergeObject: true }
  )
}
