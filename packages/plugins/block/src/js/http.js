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

import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

// 区块管理 -- 获取区块列表
export const fetchBlockList = (params) => getMetaApi(META_SERVICE.Http).get('/material-center/api/blocks', { params })

// 删除区块
export const requestDeleteBlock = (blockId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block/delete/${blockId}`)

// 区块管理 -- 保存区块
export const requestUpdateBlock = (blockId, params, config = {}) =>
  getMetaApi(META_SERVICE.Http).post(`/material-center/api/block/update/${blockId}`, params, config)

// 区块管理 -- 发布区块
export const requestDeployBlock = (params) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block/deploy/', params)

// 区块管理 -- 根据关键字搜索区块
export const requestSearchBlock = (searchKey) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label_contains=${searchKey}`)

// 区块管理 -- 根据区块ID获取区块历史备份列表
export const fetchBackupList = (blockId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block-history?block=${blockId}`)

// 区块管理 -- 新建区块
export const requestCreateBlock = (params) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block/create/', params)

// 初始化区块
export const requestInitBlocks = (params) => getMetaApi(META_SERVICE.Http).post('/generate/api/initBlocks', params)

// 获取所有区块
export const requestBlocks = () => getMetaApi(META_SERVICE.Http).get(`/material-center/api/block`)

// 区块管理 -- 查询单个区块详情
export const fetchBlockContent = (blockId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block/detail/${blockId}`)

// 区块管理 -- 根据label查询单个区块详情
export const fetchBlockContentByLabel = (label) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block?label=${label}`)

// 获取应用下的 ComponentsMap
export const fetchComponentsMap = (appId) =>
  getMetaApi(META_SERVICE.Http).get(`/app-center/api/apps/schema/components/${appId}`)

// 区块分类列表
export const fetchCategories = (params) =>
  getMetaApi(META_SERVICE.Http).get('/material-center/api/block-categories', { params })

// 更新区块分类
export const updateCategory = ({ id, ...params }) =>
  getMetaApi(META_SERVICE.Http).put(`/material-center/api/block-categories/${id}`, params)

// 新建区块分类
export const createCategory = (params) =>
  getMetaApi(META_SERVICE.Http).post(`/material-center/api/block-categories`, params)

// 删除区块分类
export const deleteCategory = (id) =>
  getMetaApi(META_SERVICE.Http).delete(`/material-center/api/block-categories/${id}`)

// 下面是区块分组的增删查改接口
// 当 Block 插件的 options.mergeCategoriesAndGroups 为 true 时，将分类的接口全部替换成分组的接口

// 区块分组列表
export const fetchGroups = (params) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block-groups`, { params: { ...params, from: 'block' } })

// 更新区块分组
export const updateGroup = ({ id, ...params }) =>
  getMetaApi(META_SERVICE.Http).post(`/material-center/api/block-groups/update/${id}`, params)

// 新建区块分组
export const createGroup = (params) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block-groups/create', params)

// 删除区块分组
export const deleteGroup = (groupId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block-groups/delete/${groupId}`)
