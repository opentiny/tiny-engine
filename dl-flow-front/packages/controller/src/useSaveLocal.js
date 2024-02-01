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
import { VITE_ORIGIN } from '@opentiny/tiny-engine-common/js/environments'
import useCanvas from './useCanvas'
import { getGlobalConfig } from './globalConfig'

// 获取当前页面的全量信息

const bridge = window.vscodeBridge

const confirmSaveLocal = async () => {
  const { pageState, setSaved } = useCanvas()
  const currentPageId = pageState.currentPageId || pageState.currentPage.id
  const currentPageName = pageState.currentPageName || pageState.currentPage.name

  const savePage = await bridge.callHandler('save-page', {
    api: `${VITE_ORIGIN}/app-service/api/pages/code/${currentPageId}`,
    pageName: currentPageName,
    pageId: currentPageId,
    platformId: getGlobalConfig()?.platformId
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
    platformId: getGlobalConfig()?.platformId
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

export default () => {
  return {
    confirmSaveLocal,
    savePageLocal
  }
}
