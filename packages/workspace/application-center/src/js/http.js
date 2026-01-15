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

/* metaService: engine.plugins.blockmanage.js-http */
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

// 模版管理 -- 业务场景全查询
export const fetchBusinessCategory = () =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/business-category/list`)

// 模版管理 -- 按分类查询业务场景
export const fetchBusinessCategoryByGroup = (group) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/business-category/find?group=${group}`)

// 应用管理 -- 获取应用列表
export const fetchApplicationList = (params) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/page`, { params }) // currentPage pageSize

// 应用管理 -- 创建应用
export const createApplication = (params) => getMetaApi(META_SERVICE.Http).post(`/app-center/api/apps/create`, params)

// 应用管理 -- 编辑应用
export const updateApplication = (id, params) =>
  getMetaApi(META_SERVICE.Http).post(`/app-center/api/apps/update/${id}`, params)

// 应用管理 -- 删除应用
export const deleteApplication = (id) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/delete/${id}`)
