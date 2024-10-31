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
      let globalState = parseSchema(schema)
      globalState = [
        {
          id: 'counter',
          state: {
            count: 0
          },
          actions: {
            increment: {
              type: 'JSFunction',
              value: 'function increment() { this.state.count++; }'
            },
            decrement: {
              type: 'JSFunction',
              value: 'function decrement() { this.state.count--; }'
            }
          },
          getters: {
            doubleCount: {
              type: 'JSFunction',
              value: 'function doubleCount() { return this.state.count * 2; }'
            }
          }
        },
        {
          id: 'user',
          state: {
            name: 'John Doe',
            age: '七十岁'
          },
          actions: {
            updateName: {
              type: 'JSFunction',
              value: 'function updateName(newName) { this.state.name = newName; }'
            },
            updateAge: {
              type: 'JSFunction',
              value: 'function updateAge(newAge) { this.state.age = newAge; }'
            }
          },
          getters: {
            fullName: {
              type: 'JSFunction',
              value: 'function fullName() { return `${this.state.name} (${this.state.age})`; }'
            }
          }
        }
      ]

      const res = []
      const ids = []

      for (const stateItem of globalState) {
        let importStatement = "import create from 'zustand'"
        const { id, state, getters, actions } = stateItem

        console.log(getters)

        ids.push(id)

        const stateExpression = `${Object.entries(state)
          .map((item) => {
            let [key, value] = item

            if (value === '') {
              value = "''"
            }

            if (value || typeof value === 'object') {
              value = JSON.stringify(value)
            }

            return [key, value].join(':')
          })
          .join(',')}`

        const actionExpressions = Object.entries(actions)
          .filter((item) => item[1]?.type === 'JSFunction')
          .map(
            ([key, value]) => `${key}: () => set((state) => {
              ${value.value.replace('this.', 'state.')}
            })`
          )
          .join(',')

        const storeFiles = `
         ${importStatement}
         export const ${id} = create((set) => ({
          ${stateExpression},
          ${actionExpressions}
        }))
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
