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

import { Modal } from '@opentiny/vue'
import { fetchMetaData, fetchPageList, fetchBlockSchema } from '../http'
import {
  useBlock,
  useCanvas,
  getMergeMeta,
  getMetaApi,
  useEnv,
  META_SERVICE,
  META_APP
} from '@opentiny/tiny-engine-meta-register'

// 获取当前页面的全量信息

const bridge = window.vscodeBridge

const confirmSaveLocal = async () => {
  const { pageState, setSaved } = useCanvas()
  const currentPageId = pageState.currentPageId || pageState.currentPage.id
  const currentPageName = pageState.currentPageName || pageState.currentPage.name

  const { VITE_ORIGIN } = useEnv()
  const savePage = await bridge.callHandler('save-page', {
    api: `${VITE_ORIGIN}/app-service/api/pages/code/${currentPageId}`,
    pageName: currentPageName,
    pageId: currentPageId,
    platformId: getMergeMeta('engine.config')?.platformId
  })

  if (savePage.error) {
    Modal.message({ message: savePage.error.message, status: 'error', duration: '5000', top: 60 })
    return
  }

  const errorMsg = savePage.data.reason
    ? `保存文件到本地失败！失败原因：${savePage.data.reason}`
    : '保存文件到本地失败！'

  const message = savePage.data.isSuccess ? '保存文件到本地成功' : errorMsg

  savePage.data.isSuccess && setSaved(true)

  Modal.message({ message, status: 'error', duration: '5000', top: 60 })
}

const savePageLocal = async () => {
  // 查询本地页面文件是否存在
  const { currentPageId, currentPageName, currentPage } = useCanvas().pageState
  const fileExistRes = await bridge.callHandler('page-is-exist', {
    pageName: currentPageName || currentPage.name,
    pageId: currentPageId || currentPage.id,
    platformId: getMergeMeta('engine.config')?.platformId
  })

  // 查询本地文件失败：存在同名文件 / 接口报错
  if (fileExistRes.error) {
    Modal.message({ message: fileExistRes.error.message, status: 'error', duration: '5000', top: 60 })
    return
  }

  // 如果本地不存在同名文件，执行保存文件到本地操作
  if (!fileExistRes.data.isExist) {
    confirmSaveLocal()
    return
  }

  // 如果本地存在同名文件，需要询问用户是否覆盖
  Modal.confirm({
    title: '查询本地文件',
    message: '本地已经存在同名文件，是否覆盖？'
  }).then((res) => {
    res === 'confirm' && confirmSaveLocal()
  })
}

const getParams = () => {
  const { getSchema } = useCanvas()
  const { isBlock, getCurrentPage } = useCanvas()
  const { getCurrentBlock } = useBlock()

  const params = {
    framework: getMergeMeta('engine.config')?.dslMode,
    platform: getMergeMeta('engine.config')?.platformId,
    pageInfo: {
      schema: getSchema()
    }
  }

  const paramsMap = new URLSearchParams(location.search)
  params.app = paramsMap.get('id')
  params.tenant = paramsMap.get('tenant')

  if (isBlock()) {
    const block = getCurrentBlock()
    params.id = block?.id
    params.pageInfo.name = block?.label
    params.type = 'Block'
  } else {
    const page = getCurrentPage()
    params.id = page?.id
    params.pageInfo.name = page?.name
    params.type = 'Page'
  }

  return params
}

const getAllPageDetails = async (pageList) => {
  const detailPromise = pageList.map(({ id }) => getMetaApi(META_APP.AppManage).getPageById(id))
  const detailList = await Promise.allSettled(detailPromise)

  return detailList
    .map((item) => {
      if (item.status === 'fulfilled' && item.value) {
        return item.value
      }
    })
    .filter((item) => Boolean(item))
}

const getPreGenerateInfo = async () => {
  const params = getParams()
  const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  const { getAllNestedBlocksSchema, generateAppCode } = getMetaApi('engine.service.generateCode')

  const promises = [
    getMetaApi(META_SERVICE.Http).get(`/app-center/v1/api/apps/schema/${id}`),
    fetchMetaData(params),
    fetchPageList(params.app)
  ]

  const [appData, metaData, pageList, dirHandle] = await Promise.all(promises)
  const pageDetailList = await getAllPageDetails(pageList)

  // 这里需要手动传入 blockSet 的原因是多页面可能会存在重复的区块
  const blockSet = new Set()
  const list = pageDetailList.map((page) => getAllNestedBlocksSchema(page.page_content, fetchBlockSchema, blockSet))
  const blocks = await Promise.allSettled(list)

  const blockSchema = []
  blocks.forEach((item) => {
    if (item.status === 'fulfilled' && Array.isArray(item.value)) {
      blockSchema.push(...item.value)
    }
  })

  const appSchema = {
    // metaData 包含dataSource、utils、i18n、globalState
    ...metaData,
    // 页面 schema
    pageSchema: pageDetailList.map((item) => {
      const { page_content, ...meta } = item

      return {
        ...page_content,
        meta: {
          ...meta,
          router: meta.route
        }
      }
    }),
    blockSchema,
    // 物料数据
    componentsMap: [...(appData.componentsMap || [])],

    meta: {
      ...(appData.meta || {})
    }
  }

  const res = await generateAppCode(appSchema)

  const { genResult = [] } = res || {}
  const fileRes = genResult.map(({ fileContent, fileName, path, fileType }) => {
    const slash = path.endsWith('/') || path === '.' ? '' : '/'
    let filePath = `${path}${slash}`
    if (filePath.startsWith('./')) {
      filePath = filePath.slice(2)
    }
    if (filePath.startsWith('.')) {
      filePath = filePath.slice(1)
    }

    if (filePath.startsWith('/')) {
      filePath = filePath.slice(1)
    }

    return {
      fileContent,
      filePath: `${filePath}${fileName}`,
      fileType
    }
  })

  return [dirHandle, fileRes]
}

export default () => {
  return {
    getPreGenerateInfo,
    confirmSaveLocal,
    savePageLocal,
    getParams
  }
}
