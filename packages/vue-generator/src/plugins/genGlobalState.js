import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: '',
  path: './src/stores'
}

function genDependenciesPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path } = realOptions

  return {
    name: 'tinyengine-plugin-generatecode-globalState',
    description: 'transform schema to globalState',
    parseSchema(schema) {
      let { global_state } = schema

      if (!Array.isArray(global_state)) {
        global_state = []
      }

      return {
        id: 'globalState',
        result: global_state
      }
    },
    transform(transformedSchema) {
      const { globalState } = transformedSchema

      const res = []
      const ids = []

      for (const stateItem of globalState) {
        let importStatement = "import { defineStore } from 'pinia'"
        const { id, state, getters, actions } = stateItem

        ids.push(id)

        const stateExpression = `() => ({ ${Object.entries(state)
          .map((item) => item.join(':'))
          .join(',')} })`

        const getterExpression = Object.entries(getters)
          .filter((item) => item.value?.type === 'JSFunction')
          .map(([key, value]) => `${key}: ${value.value}`)
          .join(',')

        const actionExpressions = Object.entries(actions)
          .filter((item) => item.value?.type === 'JSFunction')
          .map(([key, value]) => `${key}: ${value.value}`)
          .join(',')

        const storeFiles = `
         ${importStatement}
         export const ${id} = defineStore({
           id: ${id},
           state: ${stateExpression},
           getters: { ${getterExpression} },
           actions: { ${actionExpressions} }
         })
        `
        res.push({
          fileName: `${id}.js`,
          path,
          fileContent: storeFiles
        })
      }

      res.push({
        fileName: 'index.js',
        path,
        fileContent: ids.map((item) => `export { ${item} } from './${item}'`).join('\n')
      })

      return res
    }
  }
}

export default genDependenciesPlugin
