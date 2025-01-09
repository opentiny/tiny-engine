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

import { reactive, ref } from 'vue'
import { extend, isEqual } from '@opentiny/vue-renderless/common/object'
import { getOptions } from '@opentiny/tiny-engine-meta-register'

const DEFAULT_PAGE = {
  app: '',
  name: '',
  route: '',
  page_content: {
    componentName: 'Page',
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
  isBody: false,
  group: 'staticPages'
}

const selectedTemplateCard = ref(null)

const pageSettingState = reactive({
  currentPageDataCopy: {}, // 记录当前页最开始的状态，当用户点击取消按钮的时候恢复到初始状态
  currentPageData: {}, // 当前配置页面的数据
  pages: [],
  oldParentId: null,
  pageTreeKey: 0,
  isNew: false,
  ROOT_ID: '0', // 根节点ID
  updateTreeData: null,
  treeDataMapping: {}
})

const isTemporaryPage = reactive({
  saved: false
})

const generateCssString = (pageOptions, materialsOptions) => {
  if (!pageOptions?.pageBaseStyle?.className || !pageOptions?.pageBaseStyle?.style) {
    return ''
  }

  const formatCssRule = (className, style) => `.${className} {\n  ${style.trim()}\n}\n`
  const baseStyle = `.${pageOptions.pageBaseStyle.className}{\r\n ${pageOptions.pageBaseStyle.style}\r\n}\r\n`

  if (!materialsOptions.useBaseStyle) {
    return baseStyle
  }

  return [
    formatCssRule(pageOptions.pageBaseStyle.className, pageOptions.pageBaseStyle.style),
    formatCssRule(materialsOptions.blockBaseStyle.className, materialsOptions.blockBaseStyle.style),
    formatCssRule(materialsOptions.componentBaseStyle.className, materialsOptions.componentBaseStyle.style)
  ].join('\n')
}

const getDefaultPage = () => {
  const materialsOptions = getOptions('engine.plugins.materials')
  const pageOptions = getOptions('engine.plugins.appmanage')

  if (!materialsOptions || !pageOptions || !pageOptions.pageBaseStyle) {
    return { ...DEFAULT_PAGE }
  }

  return {
    ...DEFAULT_PAGE,
    page_content: {
      ...DEFAULT_PAGE.page_content,
      props: {
        ...DEFAULT_PAGE.page_content.props,
        className: pageOptions.pageBaseStyle.className
      },
      css: generateCssString(pageOptions, materialsOptions)
    }
  }
}

const isCurrentDataSame = () => {
  const data = pageSettingState.currentPageData || {}
  const dataCopy = pageSettingState.currentPageDataCopy || {}
  let isEqual = true

  Object.keys(dataCopy).some((item) => {
    // 页面比较是否更改，为了减少判断次数，不需要判断以下字段
    if (['children', 'label', 'createdBy', 'assets', 'occupier'].includes(item)) {
      return false
    } else if (item === 'page_content') {
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
    const folderData = pageSettingState.treeDataMapping[newParentId]
    const parentData = pageSettingState.treeDataMapping[oldParentId]
    const currentPageDataId = pageSettingState.currentPageData.id
    const curDataIndex = parentData.children?.findIndex?.(({ id }) => id === currentPageDataId)

    if (curDataIndex > -1) {
      parentData.children.splice(curDataIndex, 1)
      if (!folderData.children) {
        folderData.children = []
      }
      folderData.children.unshift(pageSettingState.currentPageData)
      pageSettingState.pageTreeKey++
    }
  }
}

const getPageContent = () => {
  return pageSettingState.currentPageData.page_content || {}
}

const initCurrentPageData = (pageDetail) => {
  pageSettingState.currentPageData = pageDetail
  pageSettingState.currentPageDataCopy = extend(true, {}, pageDetail)
  pageSettingState.oldParentId = pageDetail.parentId
}

const resetPageData = () => {
  pageSettingState.currentPageData = {}
  pageSettingState.currentPageDataCopy = {}
  pageSettingState.oldParentId = null
}

// 判断当前页面内容是否有修改
const isChangePageData = () => !isEqual(pageSettingState.currentPageData, pageSettingState.currentPageDataCopy)

const STATIC_PAGE_GROUP_ID = 0
const COMMON_PAGE_GROUP_ID = 1

export default () => {
  return {
    getDefaultPage,
    selectedTemplateCard,
    pageSettingState,
    isTemporaryPage,
    isCurrentDataSame,
    changeTreeData,
    getPageContent,
    resetPageData,
    initCurrentPageData,
    isChangePageData,
    STATIC_PAGE_GROUP_ID,
    COMMON_PAGE_GROUP_ID
  }
}
