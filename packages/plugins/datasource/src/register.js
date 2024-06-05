import { useApp, useCanvas, useData } from '@opentiny/tiny-engine-controller'
import { generate, parse, traverse } from '@opentiny/tiny-engine-controller/js/ast'
import { register } from '@opentiny/tiny-engine-entry'
import { camelize, capitalize } from '@vue/shared'
import { fetchDataSourceList } from './js/http'

const removeInterval = (start, end, intervalId, pageSchema) => {
  const unmountedFn = pageSchema.lifeCycles?.onUnmounted?.value
  const fetchBody = `
        /** ${start} */
        clearInterval(state.${intervalId});
        /** ${end} */`

  if (!unmountedFn) {
    pageSchema.lifeCycles = pageSchema.lifeCycles || {}
    pageSchema.lifeCycles.onUnmounted = {
      type: 'JSFunction',
      value: `function onUnmounted() {${fetchBody}}`
    }
  } else {
    if (!unmountedFn.includes(`${intervalId}`)) {
      pageSchema.lifeCycles.onUnmounted.value = unmountedFn.trim().replace(/\}$/, fetchBody + '}')
    }
  }
}

const genRemoteMethodToLifeSetup = (variableName, sourceRef, pageSchema, pollInterval) => {
  if (!sourceRef?.data?.data) {
    return
  }

  const setupFn = pageSchema.lifeCycles?.setup?.value
  const { getCommentByKey } = useData()
  const { start, end } = getCommentByKey(variableName)
  const intervalId = `intervalId${capitalize(camelize(sourceRef.name))}`
  const isPoll = pollInterval > 0

  let fetchBodyFn = `this.dataSourceMap.${sourceRef.name}.load().then(res => {
            state.${variableName} = res?.data?.items || res?.data || res
          })`

  if (isPoll) {
    fetchBodyFn = `state.${intervalId} = setInterval(() => {this.dataSourceMap.${sourceRef.name}.load().then(res => {
              state.${variableName} = res?.data?.items || res?.data || res
            })}, ${pollInterval})`
  }

  const fetchBody = `
          /** ${start} */
          ${fetchBodyFn};
          /** ${end} */`

  if (!setupFn) {
    pageSchema.lifeCycles = pageSchema.lifeCycles || {}
    pageSchema.lifeCycles.setup = {
      type: 'JSFunction',
      value: `function setup({ props, state, watch, onMounted }) {${fetchBody}}`
    }
  } else {
    if (!setupFn.includes(`this.dataSourceMap.${sourceRef.name}`)) {
      pageSchema.lifeCycles.setup.value = setupFn.trim().replace(/\}$/, fetchBody + '}')
    } else {
      const ast = parse(setupFn)
      traverse(ast, {
        ExpressionStatement(path) {
          if (path.toString().includes(sourceRef.name)) {
            path.replaceWithSourceString(fetchBodyFn)
            path.stop()
          }
        }
      })

      pageSchema.lifeCycles.setup.value = generate(ast).code
    }
  }

  if (isPoll) {
    removeInterval(start, end, intervalId, pageSchema)
  }
}

export const registerVariableConfiguratorList = () => {
  register(
    'VARIABLE_CONFIGURATOR_LIST',
    {
      datasource: {
        content: '数据源',
        getVariablesAsync: () => {
          const url = new URLSearchParams(location.search)
          const selectedId = useApp().appInfoState.selectedId || url.get('id')

          return fetchDataSourceList(selectedId).then((data) => {
            return {
              bindPrefix: '数据源： ',
              variables: data.reduce((result, item) => {
                result[item.name] = item
                return result
              }, {})
            }
          })
        },
        postConfirm: (state) => {
          const { canvasApi } = useCanvas()
          const pageSchema = canvasApi.value.getSchema()
          const stateName = state.variable.replace('this.state.', '')
          const staticData = state.variableContent.map(({ _id, ...other }) => other)

          pageSchema.state[stateName] = staticData

          // 设置画布上下文环境，让画布触发更新渲染
          canvasApi.value.setState({ [stateName]: staticData })

          const pollInterval = state.isPoll ? state.pollInterval || -1 : -1
          // 这里在setup生命周期函数内部处理用户真实环境中的数据源请求
          genRemoteMethodToLifeSetup(stateName, state.dataSouce, pageSchema, pollInterval)
        },
        _order: 600
      }
    },
    { mergeObject: true }
  )
}
