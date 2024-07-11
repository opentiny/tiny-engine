import { getMethods } from './method'

export const variableConfiguratorList = [
  {
    id: 'function',
    content: '自定义处理函数',
    getVariables: () => {
      return {
        bindPrefix: 'this.',
        variables: { ...getMethods() }
      }
    },
    _order: 300
  }
]

export const getSharedOptions = () => ({
  variableConfiguratorList
})
