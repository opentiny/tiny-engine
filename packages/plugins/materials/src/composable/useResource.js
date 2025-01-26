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

import { reactive, toRaw } from 'vue'
import { constants } from '@opentiny/tiny-engine-utils'
import { getCanvasStatus } from '@opentiny/tiny-engine-common/js/canvas'
import {
  useCanvas,
  useTranslate,
  useBreadcrumb,
  useLayout,
  useBlock,
  useMaterial,
  getMetaApi,
  META_APP,
  useMessage,
  META_SERVICE,
  usePage
} from '@opentiny/tiny-engine-meta-register'

const { COMPONENT_NAME, DEFAULT_INTERCEPTOR } = constants

const appSchemaState = reactive({
  dataSource: [],
  pageTree: [],
  langs: {},
  utils: {},
  globalState: [],
  materialsDeps: { scripts: [], styles: new Set() }
})

function goPage(pageId) {
  if (!pageId) {
    return
  }

  const url = new URL(window.location)

  url.searchParams.set('pageid', pageId)
  window.history.pushState({}, '', url)
  usePage().postLocationHistoryChanged({ pageId })
}

const initPage = (pageInfo) => {
  try {
    if (pageInfo.meta) {
      const { occupier } = pageInfo.meta

      useLayout().layoutState.pageStatus = getCanvasStatus(occupier)
      goPage(pageInfo.meta?.id)
    } else {
      useLayout().layoutState.pageStatus = {
        state: 'empty',
        data: {}
      }
    }

    pageInfo.id = pageInfo.meta?.id
  } catch (error) {
    console.log(error) // eslint-disable-line
  }

  const { id, meta, ...pageSchema } = pageInfo
  // 画布传递 schema ，多余的数据不能传递
  useCanvas().initData(pageSchema, {
    id,
    name: pageInfo?.fileName
  })
  useBreadcrumb().setBreadcrumbPage([pageInfo.fileName])
}

/**
 * 根据区块 id 初始化应用
 * @param {string} blockId 区块 id
 */
const initBlock = async (blockId) => {
  const blockApi = getMetaApi(META_APP.BlockManage)
  const blockContent = await blockApi.getBlockById(blockId)

  if (blockContent.public_scope_tenants.length) {
    blockContent.public_scope_tenants = blockContent.public_scope_tenants.map((e) => e.id)
  }

  useLayout().layoutState.pageStatus = getCanvasStatus(blockContent?.occupier)

  // 请求区块详情
  useBlock().initBlock(blockContent, {}, true)
}

const initPageOrBlock = async () => {
  const { pageId, blockId } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  const { setBreadcrumbPage } = useBreadcrumb()

  if (pageId) {
    const pagePluginApi = getMetaApi(META_APP.AppManage)

    const data = await pagePluginApi.getPageById(pageId)

    useLayout().layoutState.pageStatus = getCanvasStatus(data.occupier)
    useCanvas().initData(data.page_content, data)
    setBreadcrumbPage([data.name])
    return
  }

  if (blockId) {
    await initBlock(blockId)

    return
  }

  // url 没有 pageid 或 blockid，到页面首页或第一页
  const pageInfo = appSchemaState.pageTree.find((page) => page?.meta?.isHome) ||
    appSchemaState.pageTree.find(
      (page) => page.componentName === COMPONENT_NAME.Page && page?.meta?.group !== 'publicPages'
    ) || {
      componentName: COMPONENT_NAME.Page
    }
  initPage(toRaw(pageInfo))
}

const handlePopStateEvent = async () => {
  const { id, type } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()

  await initPageOrBlock()

  // 国际化貌似有 app 和区块之分，但是目前其实都存到了 app 里面，需要确认是否需要修复
  await useTranslate().initI18n({ host: id, hostType: type })
}

const fetchAppState = async () => {
  const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  const appData = await getMetaApi(META_SERVICE.Http).get(`/app-center/v1/api/apps/schema/${id}`)
  appSchemaState.pageTree = appData.componentsTree
  appSchemaState.componentsMap = appData.componentsMap
  appSchemaState.dataSource = appData.dataSource?.list
  appSchemaState.dataHandler = appData.dataSource?.dataHandler || DEFAULT_INTERCEPTOR.dataHandler
  appSchemaState.willFetch = appData.dataSource?.willFetch || DEFAULT_INTERCEPTOR.willFetch
  appSchemaState.errorHandler = appData.dataSource?.errorHandler || DEFAULT_INTERCEPTOR.errorHandler

  appSchemaState.bridge = appData.bridge
  appSchemaState.utils = appData.utils
  appSchemaState.isDemo = appData.meta?.is_demo
  appSchemaState.globalState = appData?.meta.global_state

  // 词条语言为空时使用默认的语言
  const defaultLocales = [
    { lang: 'zh_CN', label: 'zh_CN' },
    { lang: 'en_US', label: 'en_US' }
  ]
  const locales = Object.keys(appData.i18n).length
    ? Object.keys(appData.i18n).map((key) => ({ lang: key, label: key }))
    : defaultLocales

  appSchemaState.langs = {
    locales,
    messages: appData.i18n
  }

  return appData
}

const fetchResource = async ({ isInit = true } = {}) => {
  const { id, type } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  useMessage().publish({ topic: 'app_id_changed', data: id })

  const appData = await fetchAppState()

  useMaterial().initMaterial({ isInit, appData })

  try {
    await useMaterial().fetchMaterial()

    if (isInit) {
      await initPageOrBlock()
    }

    await useTranslate().initI18n({ host: id, hostType: type, init: true })
  } catch (error) {
    console.log(error) // eslint-disable-line
  }
}

// 获取工具类的依赖，用于预览加载。格式和物料依赖一致，便于处理
const getUtilsDeps = () => {
  return appSchemaState.utils
    .filter((item) => item.type === 'npm')
    .map((item) => {
      return {
        ...item,
        package: item.content?.package,
        script: item.content?.cdnLink
      }
    })
}

export default function () {
  return {
    appSchemaState,
    getUtilsDeps,
    fetchResource,
    initPageOrBlock,
    handlePopStateEvent,
    fetchAppState
  }
}
