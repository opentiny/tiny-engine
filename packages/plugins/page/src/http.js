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

import { useHttp } from '@opentiny/tiny-engine-http'

const http = useHttp()

// 页面管理 -- 获取页面列表
export const fetchPageList = (appId) => http.get(`/app-center/api/pages/list/${appId}`)

// 页面管理 -- 获取页面详情
export const fetchPageDetail = (pageId) => http.get(`/app-center/api/pages/detail/${pageId}`)

// 页面管理 -- 删除页面
export const requestDeletePage = (pageId) => http.get(`/app-center/api/pages/delete/${pageId}`)

// 页面管理 -- 新增页面
export const requestCreatePage = (params) => http.post('/app-center/api/pages/create', params)

// 页面管理 -- 保存页面
export const handleRouteHomeUpdate = (pageId, params) => http.post(`/app-center/api/pages/update/${pageId}`, params)

// 页面管理 -- 复制页面
export const requestCopyPage = (params) => http.post('/app-center/api/pages/copy', params)

// 页面管理 -- 获取页面历史备份列表
export const fetchPageHistory = (pageId) => http.get(`/app-center/api/pages/histories?page=${pageId}`)

// 页面管理 -- 还原历史备份
export const requestRestorePageHistory = (params) => http.post('/app-center/api/pageHistory/restore', params)

// 页面管理 -- 查看历史备份详情
export const fetchHistoryDetail = (pageId) => http.get(`/app-center/api/pages/histories/${pageId}`)

export const requestUpdatePage = (pageId, params) => http.post(`/app-center/api/pages/update/${pageId}`, params)

export default {
  fetchPageList,
  fetchPageDetail,
  requestDeletePage,
  requestCreatePage,
  requestCopyPage,
  fetchPageHistory,
  fetchHistoryDetail,
  handleRouteHomeUpdate,
  requestRestorePageHistory,
  requestUpdatePage
}
