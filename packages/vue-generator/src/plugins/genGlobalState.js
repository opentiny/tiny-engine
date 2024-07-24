import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: '',
  path: './src/stores'
}

const parseSchema = (schema) => {
  let globalState = schema?.globalState

  if (!Array.isArray(globalState)) {
    globalState = []
  }

  return globalState
}

function genDependenciesPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { path } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-globalState',
    description: 'transform schema to globalState',
    /**
     * 转换 globalState
     * @param {tinyEngineDslVue.IAppSchema} schema
     * @returns
     */
    run(schema) {
      const globalState = parseSchema(schema)

      const res = []
      const ids = []

      for (const stateItem of globalState) {
        let importStatement = "import { defineStore } from 'pinia'"
        const { id, state, getters, actions } = stateItem

        ids.push(id)

        const stateExpression = `() => ({ ${Object.entries(state)
          .map((item) => {
            let [key, value] = item

            if (typeof value === 'string') {
              value = `'${value}'`
            }

            if (value && typeof value === 'object') {
              value = JSON.stringify(value)
            }

            return [key, value].join(':')
          })
          .join(',')} })`

        const getterExpression = Object.entries(getters)
          .filter((item) => item[1]?.type === 'JSFunction')
          .map(([key, value]) => `${key}: ${value.value}`)
          .join(',')

        const actionExpressions = Object.entries(actions)
          .filter((item) => item[1]?.type === 'JSFunction')
          .map(([key, value]) => `${key}: ${value.value}`)
          .join(',')

        const storeFiles = `
         ${importStatement}
         export const ${id} = defineStore({
           id: '${id}',
           state: ${stateExpression},
           getters: { ${getterExpression} },
           actions: { ${actionExpressions} }
         })
        `
        res.push({
          fileType: 'js',
          fileName: `${id}.js`,
          path,
          fileContent: storeFiles
        })
      }

      res.push({
        fileType: 'js',
        fileName: 'index.js',
        path,
        fileContent: ids.map((item) => `export { ${item} } from './${item}'`).join('\n')
      })

      return res
    }
  }
}

export default genDependenciesPlugin
