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

export const isDevelopEnv = import.meta.env.MODE?.includes('dev')
// 模版管理 -- 获取模版列表
export const fetchTemplateList = (params) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/app-template/list`, { params })

// 模版管理 -- 通过模板创建应用
export const createAppFromTemplate = (params) =>
  getMetaApi(META_SERVICE.Http).post(`/app-center/api/app-template/create`, params)

// 模版管理 -- 按分类查询业务场景
export const fetchBusinessCategoryByGroup = (group) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/business-category/find?group=${group}`)

// 模板管理 -- 查询页面列表
export const getPageList = (id) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/pages/list/${id}`)
