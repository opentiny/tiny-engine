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

import { constants } from '@opentiny/tiny-engine-utils'
import { getCanvasStatus } from '@opentiny/tiny-engine-common/js/canvas'
import {
  useCanvas,
  useTranslate,
  useEditorInfo,
  useBreadcrumb,
  useLayout,
  useBlock,
  getMetaApi,
  META_APP
} from '@opentiny/tiny-engine-meta-register'

const { COMPONENT_NAME } = constants

const initPage = (pageInfo) => {
  try {
    if (pageInfo.meta) {
      const { occupier } = pageInfo.meta

      useLayout().layoutState.pageStatus = getCanvasStatus(occupier)
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

const initPageOrBlock = async (pageTree) => {
  const { pageId, blockId } = useEditorInfo().useInfo()
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
  const pageInfo = pageTree.find((page) => page?.meta?.isHome) ||
    pageTree.find((page) => page.componentName === COMPONENT_NAME.Page && page?.meta?.group !== 'publicPages') || {
      componentName: COMPONENT_NAME.Page
    }
  initPage(pageInfo)
}

const handlePopStateEvent = async (pageTree) => {
  const { id, type } = useEditorInfo().useInfo()
  await initPageOrBlock(pageTree)

  // 国际化貌似有 app 和区块之分，但是目前其实都存到了 app 里面，需要确认是否需要修复
  await useTranslate().initI18n({ host: id, hostType: type })
}

export default function () {
  return {
    handlePopStateEvent,
    initPageOrBlock
  }
}
