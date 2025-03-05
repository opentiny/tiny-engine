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
import { getCanvasStatus } from '@opentiny/tiny-engine-common/js/canvas'
import {
  useCanvas,
  useLayout,
  useBreadcrumb,
  useModal,
  useNotify,
  getMetaApi,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import http from '../http'

const { ELEMENT_TAG, COMPONENT_NAME } = constants

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
  isNew: false,
  ROOT_ID: '0', // 根节点ID
  updateTreeData: null,
  treeDataMapping: {}
})

const isTemporaryPage = reactive({
  saved: false
})

const STATIC_PAGE_GROUP_ID = 0
const COMMON_PAGE_GROUP_ID = 1

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

const getParentNode = (parentId) => {
  return parentId === pageSettingState.ROOT_ID
    ? { id: pageSettingState.ROOT_ID, children: pageSettingState.pages[STATIC_PAGE_GROUP_ID].data }
    : pageSettingState.treeDataMapping[parentId]
}

const changeTreeData = (newParentId, oldParentId) => {
  if (newParentId && oldParentId && String(newParentId) !== String(oldParentId)) {
    const folderData = getParentNode(newParentId)
    const parentData = getParentNode(oldParentId)

    if (!folderData || !parentData) {
      return
    }

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
  const pagesData = await http.fetchPageList(appId || getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id)

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
  const secondGroupTreeData = generateTree(secondGroupData.data)
  pageSettingState.treeDataMapping = { ...firstGroupTreeData, ...secondGroupTreeData }
  firstGroupData.data = firstGroupTreeData[pageSettingState.ROOT_ID].children
  pageSettingState.pages = [firstGroupData, secondGroupData]
  return pageSettingState.pages
}

/**
 * @param {string | number} id
 * @returns {any[]}
 */
const getAncestorsRecursively = (id) => {
  if (id === pageSettingState.ROOT_ID) {
    return []
  }

  const pageNode = pageSettingState.treeDataMapping[id]

  return [pageNode].concat(getAncestorsRecursively(pageNode.parentId))
}

/**
 * @param {string | number} id page Id
 * @param {boolean} withFolders default `false`
 * @returns {(string | number)[]}
 */
const getAncestors = async (id, withFolders) => {
  if (pageSettingState.pages.length === 0) {
    await getPageList()
  }

  if (!pageSettingState.treeDataMapping[id]) {
    return null
  }

  const ancestorsWithSelf = getAncestorsRecursively(id)
  const ancestors = ancestorsWithSelf.slice(1).reverse()

  const predicate = withFolders ? () => true : (item) => item.isPage

  return ancestors.filter(predicate).map((item) => item.id)
}

/**
 * 打平数组内的文件夹，确保返回的数组每个都是页面而不是文件夹
 * @param {Array<{isPage: boolean, children?: any[]} & Record<string, any>} pagesOrFolders 页面或者文件夹数组
 * @returns
 */
const flatternFolder = (pagesOrFolders) => {
  // 页面数组中没有文件夹，无需处理
  if (pagesOrFolders.every((item) => item.isPage)) {
    return pagesOrFolders
  }

  const flattened = pagesOrFolders
    .map((page) => {
      if (page.isPage) {
        return page
      }
      // 如果是文件夹，返回子节点数组，后面flat会打平这一层
      return (page.children || []).map((child) => ({
        ...child,
        routePath: `${page.routePath || page.route}/${child.route}`
      }))
    })
    .flat()

  return flatternFolder(flattened)
}

/**
 * 获取所有的页面直接子节点，如果子节点是文件夹，则文件夹下的节点也算直接子节点
 * @param {string | number} id
 * @returns
 */
const getPageChildren = async (id) => {
  if (pageSettingState.pages.length === 0) {
    await getPageList()
  }

  const pageNode = pageSettingState.treeDataMapping[id]

  if (!Array.isArray(pageNode?.children)) {
    return []
  }

  return flatternFolder(pageNode.children)
}

const clearCurrentState = () => {
  const { pageState } = useCanvas()

  pageState.currentVm = null
  pageState.hoverVm = null
  pageState.properties = {}
  pageState.pageSchema = null
}

const switchPage = (pageId, clearPreview = false) => {
  // 切换页面时清空 选中节点信息状态
  clearCurrentState()

  // pageId !== 0 防止 pageId 为 0 的时候判断不出来
  if (pageId !== 0 && !pageId) {
    if (clearPreview) {
      getMetaApi(META_SERVICE.GlobalService).updateParams({ pageId: '', previewId: '' })
    } else {
      getMetaApi(META_SERVICE.GlobalService).updatePageId('')
    }
    useCanvas().initData({ componentName: COMPONENT_NAME.Page }, {})
    useLayout().layoutState.pageStatus = {
      state: 'empty',
      data: {}
    }

    return
  }

  return http
    .fetchPageDetail(pageId)
    .then((data) => {
      if (data.isPage) {
        // 应该改成让 Breadcrumb 插件去监听变化
        useBreadcrumb().setBreadcrumbPage([data.name])
      }

      if (clearPreview) {
        getMetaApi(META_SERVICE.GlobalService).updateParams({ pageId, previewId: '' })
      } else {
        getMetaApi(META_SERVICE.GlobalService).updatePageId(pageId)
      }
      useLayout().closePlugin()
      useLayout().layoutState.pageStatus = getCanvasStatus(data.occupier)
      useCanvas().initData(data['page_content'], data)
    })
    .catch(() => {
      useNotify({
        type: 'error',
        message: '切换页面失败，目标页面不存在'
      })
    })
}

const switchPageWithConfirm = (pageId, clearPreview = false) => {
  const checkPageSaved = () => {
    const { isSaved, isBlock } = useCanvas()

    return new Promise((resolve) => {
      if (isSaved()) {
        resolve(true)
        return
      }

      useModal().confirm({
        title: '提示',
        message: `${isBlock() ? '区块' : '页面'}尚未保存，是否要继续切换?`,
        exec: () => {
          resolve(true)
        },
        cancel: () => {
          resolve(false)
        }
      })
    })
  }

  checkPageSaved().then((proceed) => {
    if (proceed) {
      switchPage(pageId, clearPreview)
    }
  })
}

const updatePageContent = (page, currentPage) => {
  if (currentPage.id && currentPage.pageInfo?.schema && page.id === currentPage.id) {
    page.page_content = currentPage.pageInfo?.schema
  }
}

const fetchPageDetailIfNeeded = async (page) => {
  if (!page.page_content) {
    try {
      const pageDetail = await http.fetchPageDetail(page.id)
      page.page_content = pageDetail.page_content
    } catch (error) {
      page.page_content = {}
    }
  }
}

const updateParentId = (page, pages, index, ROOT_ID) => {
  if (page.parentId !== ROOT_ID && !pages.find((item) => item.id === page.parentId)) {
    page.parentId = pages[index - 1]?.id ? pages[index - 1].id : ROOT_ID
  }
}

const handlePageDetail = async (pages, currentPage) => {
  const { ROOT_ID } = pageSettingState

  if (pages.length > 0) {
    await Promise.all(
      pages.map(async (page, index) => {
        updatePageContent(page, currentPage)
        await fetchPageDetailIfNeeded(page)
        updateParentId(page, pages, index, ROOT_ID)
      })
    )
  }
}

const getFamily = async (previewParams) => {
  if (pageSettingState.pages.length === 0) {
    await getPageList()
  }

  const familyPages = getAncestorsRecursively(previewParams.id)
    .filter((item) => item.isPage)
    .reverse()

  await handlePageDetail(familyPages, previewParams)

  return familyPages
}

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
    getPageList,
    getAncestors,
    switchPage,
    switchPageWithConfirm,
    getFamily,
    getPageChildren,
    STATIC_PAGE_GROUP_ID,
    COMMON_PAGE_GROUP_ID
  }
}
