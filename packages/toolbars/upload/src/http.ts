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

/* metaService: engine.toolbars.upload.http */

import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

// 获取页面列表
export const fetchPageList = (appId: string) => getMetaApi(META_SERVICE.Http).get(`/app-center/api/pages/list/${appId}`)

// 获取区块分组列表
export const fetchBlockGroups = (params?: any) =>
  getMetaApi(META_SERVICE.Http).get('/material-center/api/block-groups', { params: { ...params, from: 'block' } })

// 创建区块分组
export const createBlockGroup = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block-groups/create', params)

// 创建区块
export const createBlock = (params: any) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block/create', params)
