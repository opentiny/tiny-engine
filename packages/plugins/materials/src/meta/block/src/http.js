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
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'

const getParams = (obj) => {
  let result = ''
  for (let item in obj) {
    if (obj[item] instanceof Array) {
      obj[item].forEach((i) => {
        result += `&${item}=${i}`
      })
    } else if (obj[item]) {
      result += `&${item}=${obj[item]}`
    }
  }

  return result ? `?${result.slice(1)}` : result
}

// 区块消费侧 -- 获取区块分组列表
export const fetchGroups = (appId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block-groups?app=${appId}`)

// 根据区块分组ID获取该分组下的区块
export const fetchGroupBlocks = ({ groupId, value }) =>
  getMetaApi(META_SERVICE.Http).get(
    `/material-center/api/block${getParams({
      groups: groupId,
      framework: getMergeMeta('engine.config')?.dslMode,
      label_contains: value
    })}`
  )

export const fetchGroupBlocksByIds = async ({ groupIds }) => {
  const blockGroups = await getMetaApi(META_SERVICE.Http).get(
    `/material-center/api/block-groups${getParams({
      id: groupIds
    })}`
  )

  // 所有分组下面可能会有区块重复，需要去重
  const blockIdSet = new Set()
  const dslMode = getMergeMeta('engine.config')?.dslMode

  const blocks = blockGroups
    .map((group) => group.blocks.map((block) => ({ ...block, groupId: group.id, groupName: group.name })))
    .flat()
    .filter(({ framework, id }) => {
      if (dslMode === framework && !blockIdSet.has(id)) {
        blockIdSet.add(id)
        return true
      }
      return false
    })

  return blocks || []
}

export const fetchGroupBlocksById = async ({ groupId }) => {
  const blockGroup = await getMetaApi(META_SERVICE.Http).get(
    `/material-center/api/block-groups${getParams({
      id: groupId
    })}`
  )

  let data = blockGroup?.[0]?.blocks || []

  data = data
    .filter((block) => block.framework === getMergeMeta('engine.config')?.dslMode)
    .map((item) => ({ ...item, groupId }))

  return data
}

// 创建区块分组信息
export const requestCreateGroup = ({ name, app }) =>
  getMetaApi(META_SERVICE.Http).post('/material-center/api/block-groups/create', { name, app })

// 更新分组:修改分组名字/向分组里添加、删除区块
export const requestUpdateGroup = ({ id, name, app, blocks }) =>
  getMetaApi(META_SERVICE.Http).post(`/material-center/api/block-groups/update/${id}`, { name, app, blocks })

// 更新区块版本
export const requestGroupBlockVersion = async ({ groupId, blockId, blockVersion }) => {
  const app = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
  let blocks = await fetchGroupBlocksById({ groupId })

  blocks = blocks.map((block) => ({
    id: block.id,
    version: block.id === blockId ? blockVersion : block.current_version
  }))

  return requestUpdateGroup({ id: groupId, app, blocks })
}

// 根据区块分组ID删除区块分组信息
export const requestDeleteGroup = (groupId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block-groups/delete/${groupId}`)

// 根据区块ID获取区块历史备份列表
export const fetchBackupList = (blockId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block-history?block=${blockId}`)

// 获取区块详情
export const fetchBlockById = (blockId) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/block/detail/${blockId}`)

// 根据分组ID获取当前分组可以添加的区块
export const fetchAvailableBlocks = ({ groupId, label_contains, author, tag, publicType }) =>
  getMetaApi(META_SERVICE.Http).get(
    `/material-center/api/block/notgroup/${groupId}${getParams({
      label_contains,
      name_cn_contains: label_contains,
      createdBy: author,
      tags_contains: tag,
      public: publicType
    })}`
  )

// 获取区块所有标签
export const fetchTags = () => getMetaApi(META_SERVICE.Http).get(`/material-center/api/block/tags`)

// 获取区块所有作者
export const fetchUsers = () => getMetaApi(META_SERVICE.Http).get(`/material-center/api/block/users`)

// 获取区块所有tag
export const fetchTenants = () => getMetaApi(META_SERVICE.Http).get(`/material-center/api/block/tenants`)

// 恢复区块某一历史备份
export const requestRestoreBackup = ({ blockId, backupId }) =>
  getMetaApi(META_SERVICE.Http).post(`/material-center/api/block/update/${blockId}`, { current_history: backupId })
