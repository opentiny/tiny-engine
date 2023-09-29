/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { getController } from '../render/render'
import { api } from '../render/RenderMain'
import { useModal } from '@opentiny/tiny-engine-controller'

const NAME_PREFIX = {
  loop: 'loop',
  table: 'getTableData',
  page: 'pageConfig',
  grid: 'tinyGrid',
  tree: 'tinyTree',
  select: 'tinySelect'
}

const genRemoteMethodToLifeSetup = (variableName, sourceRef, pageSchema) => {
  if (sourceRef.value.data?.option) {
    const setupFn = pageSchema.lifeCycles?.setup?.value
    const fetchBody = `
    this.state.${variableName} = []
    this.dataSourceMap.${sourceRef.value.name}.load().then(data=>{  this.state.${variableName}=data })`

    if (!setupFn) {
      pageSchema.lifeCycles = pageSchema.lifeCycles || {}
      pageSchema.lifeCycles.setup = {
        type: 'JSFunction',
        value: `function setup({ props, state, watch, onMounted }) {${fetchBody}}`
      }
    } else {
      pageSchema.lifeCycles.setup.value = setupFn.trim().replace(/\}$/, fetchBody + '}')
    }
  }
}

const removeState = (pageSchema, variableName) => {
  delete pageSchema.state[variableName]

  const { parse, traverse, generate } = getController().ast
  const setupFn = pageSchema.lifeCycles?.setup?.value

  try {
    const ast = parse(setupFn)

    traverse(ast, {
      ExpressionStatement(path) {
        path.toString().includes(variableName) && path.remove()
      }
    })

    pageSchema.lifeCycles.setup.value = generate(ast).code
  } catch (error) {
    // do nothing
  }
}

const setStateWithSourceRef = (pageSchema, variableName, sourceRef, data) => {
  api.setState({ [variableName]: data })
  pageSchema.state[variableName] = data

  if (sourceRef.value.data?.option?.isSync) {
    genRemoteMethodToLifeSetup(variableName, sourceRef, pageSchema)
  }
}

const defaultHandlerTemplate = ({ node, sourceRef, schemaId, pageSchema }) => {
  const genVarName = (schemaId) => `${NAME_PREFIX.loop}${schemaId}`

  const updateNode = () => {
    const { configure } = getController().getMaterial(node?.componentName)

    if (!configure?.loop) {
      return
    }

    const variableName = genVarName(schemaId)

    setStateWithSourceRef(pageSchema, variableName, sourceRef, sourceRef.value.data?.data)

    node.loop = {
      type: 'JSExpression',
      value: `this.state.${variableName}`
    }
  }

  const clearBindVar = () => {
    const variableName = genVarName(schemaId)

    removeState(pageSchema, variableName)
  }

  return {
    updateNode,
    clearBindVar
  }
}

const generateAssginColumns = (newColumns, oldColumns) => {
  newColumns.forEach((item) => {
    const targetColumn = oldColumns.find((value) => value.field === item.field)
    if (targetColumn) {
      Object.assign(item, targetColumn)
    }
  })
  return newColumns
}

const askShouldImportData = ({ node, sourceRef }) => {
  useModal().confirm({
    message: '检测到表格存在配置的数据，是否需要引入？',
    exec() {
      const sourceColums = sourceRef.value?.data?.columns?.map(({ title, field }) => ({ title, field })) || []
      // 这里需要找到对应列，然后进行列合并
      node.props.columns = generateAssginColumns(sourceColums, node.props.columns)
    },
    cancel() {
      node.props.columns = [...sourceRef.value.data?.columns]
    }
  })
}

const updateNodeHandler = ({ node, sourceRef, pageSchema, sourceName, methodName }) => {
  if (!node || !node.props) {
    return
  }

  // 如果使用了数据元则需要删除表格的data属性
  delete node?.props?.data

  if (node.props.columns.length) {
    askShouldImportData({ node, sourceRef })
  } else {
    node.props.columns = [...sourceRef.value.data?.columns]
  }

  const pageConfig = {
    attrs: {
      currentPage: 1,
      pageSize: 50,
      pageSizes: [10, 20, 50],
      total: 0,
      layout: 'sizes,total, prev, pager, next, jumper'
    }
  }

  node.props.pager = pageConfig

  pageSchema.methods[methodName] = {
    type: 'JSFunction',
    value: `function ${methodName}({ page, sort, sortBy, filters}) {
/**
* @param {Object} sort 排序数据
* @param {Array} sortBy 排序方式
* @param {Object} page 分页数据
* @param {Array} filters 筛选数据
* @returns {Object} 返回一个promise对象，并且resolve格式为{ result: Array, page: { total: Number } }
*/
return new Promise((resolve, reject) => {
this.dataSourceMap.${sourceName}.load().then((res) => {
  // 如果按照数据源面板的建议格式编写dataHandler
  // 那么dataSourceMap的res格式应该是：{ code: string, msg: string, data: {items: any[], total: number} }
  resolve({ result: res.data.items, page: { total: res.data.total } });
});
});
}`
  }
}

const extraHandlerMap = {
  TinyGrid: ({ node, sourceRef, schemaId, pageSchema }) => {
    const sourceName = sourceRef.value?.name
    const methodName = `${NAME_PREFIX.table}${schemaId}`

    node.props.fetchData = {
      type: 'JSExpression',
      value: `{ api: this.${methodName} }`
    }

    const updateNode = () => updateNodeHandler({ node, sourceRef, pageSchema, sourceName, methodName })

    const clearBindVar = () => {
      // 当数据源组件children字段为空时，及时清空创建的methods
      delete pageSchema.methods[methodName]
    }

    return {
      updateNode,
      clearBindVar
    }
  },
  TinyTree: ({ node, sourceRef, schemaId, pageSchema }) => {
    const genVarName = (schemaId) => `${NAME_PREFIX.tree}${schemaId}`

    const updateNode = () => {
      const variableName = genVarName(schemaId)

      const arrayToTree = (data) => {
        const map = {}
        const tree = []
        let node = null
        let i = 0

        for (i = 0; i < data.length; i++) {
          map[data[i].id] = data[i]
          data[i].children = []
        }

        for (i = 0; i < data.length; i++) {
          node = data[i]
          if (node.pid !== '') {
            map[node.pid]?.children?.push(node)
          } else {
            tree.push(node)
          }
        }

        return tree
      }

      setStateWithSourceRef(pageSchema, variableName, sourceRef, arrayToTree(sourceRef.value.data?.data))

      node.props.data = {
        type: 'JSExpression',
        value: `this.state.${variableName}`
      }
    }

    const clearBindVar = () => {
      const variableName = genVarName(schemaId)

      removeState(pageSchema, variableName)
    }

    return {
      updateNode,
      clearBindVar
    }
  },
  TinySelect: ({ node, sourceRef, schemaId, pageSchema }) => {
    const genVarName = (schemaId) => `${NAME_PREFIX.select}${schemaId}`

    const updateNode = () => {
      const variableName = genVarName(schemaId)

      setStateWithSourceRef(pageSchema, variableName, sourceRef, sourceRef.value.data?.data)

      node.props.options = {
        type: 'JSExpression',
        value: `this.state.${variableName}`
      }
    }

    const clearBindVar = () => {
      const variableName = genVarName(schemaId)

      removeState(pageSchema, variableName)
    }

    return {
      updateNode,
      clearBindVar
    }
  }
}

export const getHandler = ({ node, sourceRef, schemaId, pageSchema }) =>
  extraHandlerMap[node.componentName]
    ? extraHandlerMap[node.componentName]({ node, sourceRef, schemaId, pageSchema })
    : defaultHandlerTemplate({ node, sourceRef, schemaId, pageSchema })
