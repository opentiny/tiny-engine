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

/* eslint-disable no-new-func */
import { reactive, ref } from 'vue'
import * as jsondiffpatch from 'jsondiffpatch'
import DiffMatchPatch from 'diff-match-patch'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import { useHistory, getMetaApi, useMessage } from '@opentiny/tiny-engine-meta-register'

const { COMPONENT_NAME } = constants
const { deepClone } = utils

const defaultPageState = {
  currentVm: null,
  currentSchema: null,
  currentType: null,
  pageSchema: null,
  properties: null,
  dataSource: null,
  dataSourceMap: null,
  isSaved: true,
  isLock: false,
  isBlock: false,
  nodesStatus: {},
  loading: false
}

const defaultSchema = {
  componentName: 'Page',
  fileName: '',
  css: '',
  props: {},
  lifeCycles: {},
  children: [],
  dataSource: {
    list: []
  },
  methods: {},
  bridge: {
    imports: []
  },
  state: {},
  inputs: [],
  outputs: []
}

const canvasApi = ref({})
const isCanvasApiReady = ref(false)
const nodesMap = ref(new Map())

const initCanvasApi = (newCanvasApi) => {
  canvasApi.value = newCanvasApi
  isCanvasApiReady.value = true
}

const pageState = reactive({ ...defaultPageState, loading: true })
const rootSchema = ref([
  {
    id: 0,
    componentName: 'div',
    props: pageState.pageSchema?.props || {},
    children: pageState.pageSchema?.children || []
  }
])

const generateNodesMap = (nodes, parent) => {
  nodes.forEach((nodeItem) => {
    if (!nodeItem.id) {
      nodeItem.id = utils.guid()
    }

    nodesMap.value.set(nodeItem.id, {
      node: nodeItem,
      parent
    })

    if (Array.isArray(nodeItem.children) && nodeItem.children.length) {
      generateNodesMap(nodeItem.children, nodeItem)
    }
  })
}

const jsondiffpatchInstance = jsondiffpatch.create({
  objectHash: function (obj, index) {
    return obj.fileName || obj.id || `$$index:${index}`
  },
  arrays: {
    detectMove: true,
    includeValueOnMove: false
  },
  textDiff: {
    diffMatchPatch: DiffMatchPatch,
    minLength: 60
  },
  // eslint-disable-next-line no-unused-vars
  propertyFilter: function (name, context) {
    return name.slice(0, 1) !== '$'
  },
  cloneDiffValues: false
})

const { publish } = useMessage()

// 重置画布数据
const resetCanvasState = async (state = {}) => {
  const previousSchema = JSON.parse(JSON.stringify(pageState.pageSchema))

  Object.assign(pageState, defaultPageState, state)

  nodesMap.value.clear()

  if (pageState.pageSchema) {
    if (!pageState.pageSchema.children) {
      pageState.pageSchema.children = []
    }

    rootSchema.value = [
      {
        id: 0,
        componentName: 'div',
        props: pageState.pageSchema.props || {},
        children: pageState.pageSchema.children
      }
    ]

    nodesMap.value.set(0, { node: rootSchema.value, parent: pageState.pageSchema })

    generateNodesMap(pageState.pageSchema.children, pageState.pageSchema)
  }

  const diffPatch = jsondiffpatchInstance.diff(previousSchema, pageState.pageSchema)

  publish({ topic: 'schemaImport', data: { current: pageState.pageSchema, previous: previousSchema, diffPatch } })
}

// 页面重置画布数据
const resetPageCanvasState = (state = {}) => {
  state.isBlock = false
  resetCanvasState(state)
  useHistory().addHistory(state.pageSchema)
}

// 区块重置画布数据
const resetBlockCanvasState = async (state = {}) => {
  state.isBlock = true
  await resetCanvasState(state)
}

const getDefaultSchema = (componentName = 'Page', fileName = '') => {
  const DEFAULT_PAGE = getMetaApi('engine.service.page')?.getDefaultPage() || { page_content: { props: {}, css: '' } }

  return {
    ...defaultSchema,
    props: DEFAULT_PAGE.page_content?.props || {},
    css: DEFAULT_PAGE.page_content?.css || '',
    componentName,
    fileName
  }
}

const setSaved = (flag = false) => {
  pageState.isSaved = flag
}

// 清空画布
const clearCanvas = () => {
  pageState.properties = null

  const { fileName, componentName } = pageState.pageSchema || {}

  resetCanvasState({
    pageSchema: { ...getDefaultSchema(componentName, fileName) }
  })

  setSaved(false)
}

const isBlock = () => pageState.isBlock

// 初始化页面数据
const initData = (schema = { ...defaultSchema }, currentPage) => {
  if (schema.componentName === COMPONENT_NAME.Block) {
    resetBlockCanvasState({
      pageSchema: schema,
      loading: false
    })
  } else {
    resetPageCanvasState({
      pageSchema: schema,
      currentPage,
      loading: false
    })
  }

  useHistory().addHistory(schema)
}

const isSaved = () => pageState.isSaved

const isLoading = () => pageState.loading

const getPageSchema = () => {
  return pageState.pageSchema || {}
}

const setCurrentSchema = (schema) => {
  pageState.currentSchema = schema
}

const getCurrentSchema = () => pageState.currentSchema

const clearCurrentState = () => {
  pageState.currentVm = null
  pageState.hoverVm = null
  pageState.properties = {}
  pageState.pageSchema = null
}
const getCurrentPage = () => pageState.currentPage

const getNodeById = (id) => {
  return nodesMap.value.get(id)?.node
}

const getNodeWithParentById = (id) => {
  return nodesMap.value.get(id)
}

const delNode = (id) => {
  nodesMap.value.delete(id)
}

const clearNodes = () => {
  nodesMap.value.clear()
}

const setNode = (schema, parent) => {
  schema.id = schema.id || utils.guid()

  nodesMap.value.set(schema.id, { node: schema, parent })
}

const getNode = (id, parent) => {
  return parent ? nodesMap.value.get(id) : nodesMap.value.get(id)?.node
}

const operationTypeMap = {
  insert: (operation) => {
    const { parentId, newNodeData, position, referTargetNodeId } = operation

    const parentNode = getNode(parentId) || pageState.pageSchema

    if (!parentNode) {
      return {}
    }

    parentNode.children = parentNode.children || []

    if (referTargetNodeId) {
      const referenceNode = getNode(referTargetNodeId)
      let index = parentNode.children.indexOf(referenceNode)

      if (index === -1) {
        index = 0
      }

      index = position === 'before' ? index : index + 1

      parentNode.children.splice(index, 0, newNodeData)

      setNode(newNodeData, parentNode)

      return {
        current: newNodeData,
        previous: undefined
      }
    }

    if (position === 'after') {
      parentNode.children.push(newNodeData)
      setNode(newNodeData, parentNode)
    }

    return {
      current: newNodeData,
      previous: undefined
    }
  },
  delete: (operation) => {
    const { id } = operation
    let targetNode = getNode(id, true)
    let { parent, node } = targetNode

    const index = parent.children.indexOf(node)

    if (index > -1) {
      parent.children.splice(index, 1)
      nodesMap.value.delete(node.id)
    }

    return {
      current: undefined,
      previous: node
    }
  },
  changeProps: (operation) => {
    const { id, value, option: changeOption } = operation
    const { node, parent } = getNode(id, true)
    const previous = deepClone(node)

    const { overwrite = false } = changeOption || {}

    if (!node) {
      return
    }

    if (overwrite) {
      setNode({ id, ...value }, parent)
    } else {
      Object.assign(node, value || {})
    }

    return {
      current: node,
      previous
    }
  }
}

const lastUpdateType = ref('')

const operateNode = (operation) => {
  if (!operationTypeMap[operation.type]) {
    return
  }

  operationTypeMap[operation.type](operation)

  lastUpdateType.value = operation.type

  publish({ topic: 'schemaChange', data: { operation } })
}

// 获取传入的 schema 与最新 schema 的 diff
const getSchemaDiff = (schema) => {
  return jsondiffpatchInstance.diff(schema, pageState.pageSchema)
}

const patchLatestSchema = (schema) => {
  // 这里 pageSchema 需要反序列化一下，不然 patch 的时候，会 patch 成同一个引用，造成画布无法更新
  const diff = jsondiffpatchInstance.diff(schema, JSON.parse(JSON.stringify(pageState.pageSchema)))

  if (diff) {
    jsondiffpatchInstance.patch(schema, diff)
  }
}

const importSchema = (data) => {
  let importData = data

  if (typeof data === 'string') {
    try {
      importData = JSON.parse(data)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[useCanvas.importSchema] Invalid data')
    }
  }

  // JSON 格式校验
  resetCanvasState({
    pageSchema: importData
  })
}

const exportSchema = () => {
  return JSON.stringify(pageState.pageSchema)
}

const getSchema = () => {
  return pageState.pageSchema || {}
}

const getNodePath = (id, nodes = []) => {
  const { parent, node } = getNodeWithParentById(id) || {}

  node && nodes.unshift({ name: node.componentName, node: id })

  if (parent) {
    parent && getNodePath(parent.id, nodes)
  } else {
    nodes.unshift({ name: 'BODY', node: id })
  }

  return nodes
}

const updateSchema = (data) => {
  Object.assign(pageState.pageSchema, data)

  publish({ topic: 'schemaChange', data: {} })
}

export default function () {
  return {
    pageState,
    isBlock,
    isSaved,
    isLoading,
    initData,
    setSaved,
    clearCanvas,
    getPageSchema,
    resetPageCanvasState,
    resetBlockCanvasState,
    clearCurrentState,
    getCurrentSchema,
    setCurrentSchema,
    getCurrentPage,
    initCanvasApi,
    canvasApi,
    isCanvasApiReady,
    getNodeById,
    getNodeWithParentById,
    delNode,
    clearNodes,
    setNode,
    getNode,
    operateNode,
    lastUpdateType,
    getSchemaDiff,
    patchLatestSchema,
    importSchema,
    exportSchema,
    getSchema,
    getNodePath,
    updateSchema
  }
}
