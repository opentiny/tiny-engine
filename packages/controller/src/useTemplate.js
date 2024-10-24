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

import { reactive } from 'vue'
import { extend, isEqual } from '@opentiny/vue-renderless/common/object'
import { useHttp } from '@opentiny/tiny-engine-http'

const DEFAULT_TEMPLATE = {
  app: '',
  name: '',
  template_content: {
    componentName: 'Template',
    css: '',
    props: {},
    lifeCycles: {},
    children: [],
    dataSource: {
      list: []
    },
    state: {},
    methods: {},
    utils: [],
    bridge: [],
    inputs: [],
    outputs: []
  },
  isHome: false,
  parentId: 'none',
  isBody: false
}

const templateSettingState = reactive({
  currentTemplateDataCopy: {}, // 记录当前template最开始的状态，当用户点击取消按钮的时候恢复到初始状态
  currentTemplateData: {}, // 当前配置template的数据
  templates: [],
  oldParentId: null,
  templateTreeKey: 0,
  isNew: false,
  ROOT_ID: '0000000000000000', // 根节点ID
  updateTreeData: null,
  treeDataMapping: {},
  currentNodeTreeData: {}
})

const isTemporaryTemplate = reactive({
  saved: false
})
const isCurrentDataSame = () => {
  const data = templateSettingState.currentTemplateData || {}
  const dataCopy = templateSettingState.currentTemplateDataCopy || {}
  let isEqual = true

  Object.keys(dataCopy).some((item) => {
    // 页面比较是否更改，为了减少判断次数，不需要判断以下字段
    if (['children', 'label', 'createdBy', 'assets', 'occupier'].includes(item)) {
      return false
    } else if (item === 'template_content') {
      const obj = {
        inputs: dataCopy[item].inputs,
        outputs: dataCopy[item].outputs,
        lifeCycles: dataCopy[item].lifeCycles
      }
      const objCopy = {
        inputs: data[item].inputs,
        outputs: data[item].outputs,
        lifeCycles: data[item].lifeCycles
      }

      if (JSON.stringify(obj) !== JSON.stringify(objCopy)) {
        isEqual = false
      }
    } else {
      if (dataCopy[item] !== data[item]) {
        isEqual = false
      }
    }

    return !isEqual
  })

  return isEqual
}

const changeTreeData = (newParentId, oldParentId) => {
  if (newParentId && oldParentId && newParentId !== oldParentId) {
    const folderData = templateSettingState.treeDataMapping[newParentId]
    const parentData = templateSettingState.treeDataMapping[oldParentId]
    const currentTemplateDataId = templateSettingState.currentTemplateData.id
    const curDataIndex = parentData.children?.findIndex?.(({ id }) => id === currentTemplateDataId)

    if (curDataIndex > -1) {
      parentData.children.splice(curDataIndex, 1)
      if (!folderData.children) {
        folderData.children = []
      }
      folderData.children.unshift(templateSettingState.currentTemplateData)
      templateSettingState.templateTreeKey++
    }
  }
}

const getTemplateContent = () => {
  return templateSettingState.currentTemplateData.template_content || {}
}

const initCurrentTemplateData = (templateDetail) => {
  templateSettingState.currentTemplateData = templateDetail
  templateSettingState.currentTemplateDataCopy = extend(true, {}, templateDetail)
  templateSettingState.currentNodeTreeData = templateDetail.nodeTreeData
  templateSettingState.oldParentId = templateDetail.parentId
}

const resetTemplateData = () => {
  templateSettingState.currentTemplateData = {}
  templateSettingState.currentTemplateDataCopy = {}
  templateSettingState.oldParentId = null
}

// 判断当前页面内容是否有修改
const isChangeTemplateData = () =>
  !isEqual(templateSettingState.currentTemplateData, templateSettingState.currentTemplateDataCopy)

const http = useHttp()

const formatTreeData = (data) => {
  const map = {}
  const tree = []

  data.forEach((item) => {
    map[item.id] = { ...item, children: [] }
  })

  data.forEach((item) => {
    if (item.parentId) {
      const parent = map[item.parentId]
      if (parent) {
        parent.children.push(map[item.id])
      }
    } else {
      tree.push(map[item.id])
    }
  })
  templateSettingState.treeDataMapping = map

  return tree
}

const refreshTemplateList = async (appId, data) => {
  const templateData = data ? data : await http.get(`/app-center/api/templates/list/${appId}`)
  templateSettingState.templates = formatTreeData(templateData)
  return templateSettingState.templates
}

export default () => {
  return {
    DEFAULT_TEMPLATE,
    templateSettingState,
    isTemporaryTemplate,
    isCurrentDataSame,
    changeTreeData,
    getTemplateContent,
    resetTemplateData,
    initCurrentTemplateData,
    isChangeTemplateData,
    refreshTemplateList
  }
}
