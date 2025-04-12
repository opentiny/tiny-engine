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
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema) {
      const globalState = parseSchema(schema)

      let importStatement = "import { defineStore } from 'pinia'"
      const state = {}
      const getters = {}
      const actions = {}

      const res = []

      for (const stateItem of globalState) {
        const { id, state: stateValue, getters: gettersValue = [], actions: actionsValue = [] } = stateItem

        state[id] = stateValue
        Object.keys(gettersValue).forEach((key) => {
          if (typeof gettersValue[key] === 'object' && gettersValue[key].type === 'JSFunction') {
            if (gettersValue[key].value.includes('this')) {
              gettersValue[key].value = gettersValue[key].value.replace(/this\./g, `this.${id}.`)
            }
            getters[key] = gettersValue[key].value
          }
        })
        Object.keys(actionsValue).forEach((key) => {
          if (typeof actionsValue[key] === 'object' && actionsValue[key].type === 'JSFunction') {
            if (actionsValue[key].value.includes('this')) {
              actionsValue[key].value = actionsValue[key].value.replace(/this\./g, `this.${id}.`)
            }
            actions[key] = actionsValue[key].value
          }
        })
      }

      const globalStateFiles = `
        ${importStatement}
        export const globalState = defineStore('globalState', {
           state: () => (${JSON.stringify(state, null, 2)}),
           getters: {${Object.entries(getters)
             .map(([key, value]) => `${key}: ${value}`)
             .join(',')}},
           actions: {${Object.entries(actions)
             .map(([key, value]) => `${key}: ${value}`)
             .join(',')}}
         })
        
         export const useGlobalState = () => {
            // 获取 globalState 实例
            const globalStateInstance = globalState();

            return globalStateInstance;
          };

      `

      res.push({
        fileType: 'js',
        fileName: 'globalState.js',
        path: './src/stores',
        fileContent: globalStateFiles
      })

      res.push({
        fileType: 'js',
        fileName: 'index.js',
        path,
        fileContent: `export { globalState } from './globalState'`
      })

      return res
    }
  }
}

export default genDependenciesPlugin
