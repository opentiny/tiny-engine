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
import { constants } from '@opentiny/tiny-engine-utils'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import http from '../http'

const { ELEMENT_TAG } = constants

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
  isNew: false,
  ROOT_ID: '0', // 根节点ID
  updateTreeData: null,
  treeDataMapping: {}
})

const isTemporaryPage = reactive({
  saved: false
})
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
      const splicedPageData = parentData.children.splice(curDataIndex, 1)[0]
      if (!folderData.children) {
        folderData.children = []
      }
      folderData.children.unshift(splicedPageData)
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

/**
 *
 * @typedef {Object} PageData
 * @property {string | number} id
 * @property {string | number} parentId
 *
 * @typedef {Object} PageNode
 * @property {string | number} id
 * @property {string | number} parentId
 * @property {PageNode[] | undefined} children
 *
 * @param {PageData[]} data
 * @returns
 */
const generateTree = (data) => {
  const { ROOT_ID } = pageSettingState

  /** @type {Record<string, PageNode>} */
  const treeDataMapping = { [ROOT_ID]: { id: ROOT_ID } }

  data.forEach((item) => {
    treeDataMapping[item.id] = item
  })

  data.forEach((item) => {
    const parentNode = treeDataMapping[item.parentId]

    if (!parentNode) {
      return
    }

    parentNode.children = parentNode.children || []
    parentNode.children.push(item)
  })

  return treeDataMapping
}

const getPageList = async (appId) => {
  const pagesData = await http.fetchPageList(appId)

  const firstGroupData = { groupName: '静态页面', groupId: STATIC_PAGE_GROUP_ID, data: [] }
  const secondGroupData = { groupName: '公共页面', groupId: COMMON_PAGE_GROUP_ID, data: [] }

  pagesData.forEach((item) => {
    const namedNode = item.name ? item : { ...item, name: item.folderName, group: 'staticPages' }
    const node = item.meta
      ? {
          ...item,
          ...item.meta,
          name: item.fileName,
          isPage: true,
          isBody: item.meta.rootElement === ELEMENT_TAG.Body
        }
      : namedNode

    const { children, ...other } = node

    if (node.group === 'staticPages') {
      firstGroupData.data.push(other)
    } else {
      secondGroupData.data.push(other)
    }
  })

  const firstGroupTreeData = generateTree(firstGroupData.data)
  pageSettingState.treeDataMapping = firstGroupTreeData
  firstGroupData.data = firstGroupTreeData[pageSettingState.ROOT_ID].children
  pageSettingState.pages = [firstGroupData, secondGroupData]
  return pageSettingState.pages
}

/**
 * @param {string | number} id page Id
 * @param {boolean} withFolders default `false`
 * @returns {(string | number)[]}
 */
const getAncestors = async (id, withFolders) => {
  if (pageSettingState.pages.length === 0) {
    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    await getPageList(appId)
  }

  /**
   * @param {string | number} id
   * @param {(string | number)[]} ancestors
   * @returns {(string | number)[]}
   */
  const getAncestorsRecursively = (id) => {
    const pageNode = pageSettingState.treeDataMapping[id]

    if (pageNode.id === pageSettingState.ROOT_ID) {
      return []
    }

    return [pageNode].concat(getAncestorsRecursively(pageNode.parentId))
  }

  const ancestorsWithSelf = getAncestorsRecursively(id)
  const ancestors = ancestorsWithSelf.slice(1).reverse()

  if (withFolders) {
    return ancestors.map((item) => item.id)
  }
  return ancestors.filter((item) => item.isPage).map((item) => item.id)
}

export default () => {
  return {
    DEFAULT_PAGE,
    selectedTemplateCard,
    pageSettingState,
    isTemporaryPage,
    isCurrentDataSame,
    changeTreeData,
    getPageContent,
    resetPageData,
    initCurrentPageData,
    isChangePageData,
    getPageList,
    getAncestors,
    STATIC_PAGE_GROUP_ID,
    COMMON_PAGE_GROUP_ID
  }
}
