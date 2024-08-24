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

// 模板管理 -- 获取模板列表
export const fetchTemplateList = (appId) => http.get(`/app-center/api/templates/list/${appId}`)

// 模板管理 -- 获取模板详情
export const fetchTemplateDetail = (templateId) => http.get(`/app-center/api/templates/detail/${templateId}`)

// 模板管理 -- 删除模板
export const requestDeleteTemplate = (templateId) => http.get(`/app-center/api/templates/delete/${templateId}`)

// 模板管理 -- 新增模板
export const requestCreateTemplate = (params) => http.post('/app-center/api/templates/create', params)

// 模板管理 -- 保存模板
export const handleRouteHomeUpdate = (templateId, params) =>
  http.post(`/app-center/api/templates/update/${templateId}`, params)

// 模板管理 -- 复制模板
export const requestCopyTemplate = (params) => http.post('/app-center/api/templates/copy', params)

// 模板管理 -- 获取模板历史备份列表
export const fetchTemplateHistory = (templateId) => http.get(`/app-center/api/templates/histories?page=${templateId}`)

// 模板管理 -- 还原历史备份
export const requestRestoreTemplateHistory = (params) => http.post('/app-center/api/templateHistory/restore', params)

// 模板管理 -- 查看历史备份详情
export const fetchHistoryDetail = (templateId) => http.get(`/app-center/api/templates/histories/${templateId}`)

export const requestUpdateTemplate = (templateId, params) =>
  http.post(`/app-center/api/templates/update/${templateId}`, params)

export default {
  fetchTemplateList,
  fetchTemplateDetail,
  requestDeleteTemplate,
  requestCreateTemplate,
  requestCopyTemplate,
  fetchTemplateHistory,
  fetchHistoryDetail,
  handleRouteHomeUpdate,
  requestRestoreTemplateHistory,
  requestUpdateTemplate
}
