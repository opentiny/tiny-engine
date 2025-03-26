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

import { db } from '../db'
import { formatDateTime, getResponseData } from './commonUtils'

export const blockRoutes = [
  // 获取指定应用下所有区块
  {
    url: /\/material-center\/api\/blocks/,
    method: 'GET',
    response: async () => {
      const allBlocks = await db.block.toArray()

      return [200, getResponseData(allBlocks)]
    }
  },
  /**********-------- 区块 -----------***********/
  // 新建区块分组
  {
    url: /\/material-center\/api\/block-groups\/create/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const groupItem = await db.blockGroup.where('name').equals(data.name).limit(1).first()

      if (groupItem) {
        return [200, { error: '分组名已存在' }]
      }
      const time = formatDateTime()

      Object.assign(data, {
        createdBy: 1,
        lastUpdatedBy: 1,
        tenantId: 1,
        renterId: 1,
        siteId: 1,
        platformId: 1,
        description: null,
        created_at: time,
        updated_at: time,
        app: 1
      })
      const newGroupId = await db.blockGroup.add(data)
      const newGroup = await db.blockGroup.get(newGroupId)

      return [200, getResponseData([newGroup])]
    }
  },
  // 更新区块分组
  {
    url: /\/material-center\/api\/block-groups\/update\/\d+/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const id = Number(config.url.split('/').at(-1))
      const groupItem = await db.blockGroup.get(id)

      if (!groupItem) {
        return [200, { error: '分组不存在，更新失败' }]
      }
      const time = formatDateTime()
      const { blocks, ...rest } = data

      if (blocks) {
        Object.assign(groupItem, { materialBlocks: blocks })

        blocks.forEach(async (blockItem) => {
          const id = Number(blockItem.id)
          const blockDetail = await db.block.get(id)
          blockDetail.current_version = blockItem.version
          await db.block.update(id, blockDetail)
        })
      }

      Object.assign(groupItem, {
        ...rest,
        updated_at: time,
        app: 1
      })
      await db.blockGroup.update(groupItem.id, groupItem)
      const updatedGroupDetail = await db.blockGroup.get(groupItem.id)

      return [200, getResponseData([updatedGroupDetail])]
    }
  },
  // 获取指定应用下所有区块分组
  {
    url: /\/material-center\/api\/block-groups/,
    method: 'GET',
    response: async (config) => {
      const blockGroups = await db.blockGroup.toArray()
      const query = config.params || {}
      const source = query.from

      const promises = blockGroups.map(async(item) => {
        let blocks = []
        if (source !== 'block') {
          const idVersionMap = {}
          const ids = (item.materialBlocks || []).map((item) => {
            idVersionMap[item.id] = item.version

            return item.id
          })
          blocks = await db.blockHistories.where('block_id').anyOf(ids).toArray()

          blocks = blocks
            .filter(item => item.version === idVersionMap[item.block_id])
            .map(item => ({ ...item, id: item.block_id }))
        } else {
          const ids = item.blocks || []
          blocks = await db.block.bulkGet(ids)

        }
        item.blocks = blocks
        return item
      })

      const allBlockGroups = await Promise.all(promises)

      return [200, getResponseData(allBlockGroups)]
    }
  },
  // 获取指定区块分组详情
  {
    url: /\/material-center\/api\/block-groups\?id=\d+/,
    method: 'GET',
    response: async (config) => {
      const urlSearch = new URLSearchParams(config.url.split('?')[1])
      const id = urlSearch.get('id')
      const blockGroupDetail = await db.blockGroup.get(Number(id))
      
      return [200, getResponseData([blockGroupDetail])]
    }
  },
  // 获取区块详情
  {
    url: /\/material-center\/api\/block\/detail\/\d+/,
    method: 'GET',
    response: async (config) => {
      const id = Number(config.url.split('/').at(-1))
      const blockDetail = await db.block.get(id)
      const histories = await db.blockHistories.where('block_id').equals(id).toArray()
      blockDetail.histories = histories

      return [200, getResponseData(blockDetail)]
    }
  },
  // 新建区块
  {
    url: /\/material-center\/api\/block\/create/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)

      const time = formatDateTime()

      Object.assign(data, {
        createdBy: 1,
        lastUpdatedBy: 1,
        tenantId: 1,
        renterId: 1,
        siteId: 1,
        assets: {},
        description: null,
        tags: [],
        path: "default",
        occupierId: "1",
        i18n: {},
        created_at: time,
        updated_at: time,
        is_official: false,
        is_default: false,
        created_app: 1,
        platform_id: 1,
        public_scope_tenants: [],
        is_published: false,
        current_version: null
      })
      const newBlockId = await db.block.add(data)
      const blockDetail = await db.block.get(newBlockId)

      // 选了区块分组
      if (Array.isArray(data.groups) && data.groups.length) {
        const groupId = Number(data.groups[0])
        const group = await db.blockGroup.get(groupId)

        if (!Array.isArray(group.blocks)) {
          group.blocks = []
        }

        group.blocks.push(newBlockId)
        await db.blockGroup.update(groupId, group)
        blockDetail.path = group.name
        await db.block.update(newBlockId, blockDetail)
      }

      return [200, getResponseData(blockDetail)]
    }
  },
  // 更新区块
  {
    url: /\/material-center\/api\/block\/update\/\d+/,
    method: 'POST',
    response: async (config) => {
      const id = Number(config.url.split('/').at(-1))
      const data = JSON.parse(config.data)
      // 更新区块分组
      const group = data.groups
      const allGroups = await db.blockGroup.toArray()

      const promises = allGroups.map(async (groupItem) => {
        const isNextExist = group.includes(groupItem.id)
        // 移除
        if (groupItem.blocks.includes(id) && !isNextExist) {
          const newBlocks = groupItem.blocks.filter((item) => item !== id)
          groupItem.blocks = newBlocks
          await db.blockGroup.update(groupItem.id, groupItem)
        }
        // 添加
        if (!groupItem.blocks.includes(id) && isNextExist) {
          groupItem.blocks.push(id)
          await db.blockGroup.update(groupItem.id, groupItem)
        }
      })

      await Promise.all(promises)
      await db.block.update(id, data)
      const blockDetail = await db.block.get(id)

      return [200, getResponseData(blockDetail)]
    }
  },
  // 发布区块
  {
    url: /\/material-center\/api\/block\/deploy/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const { block, version, deploy_info } = data
      const { id, label } = block

      // 1. 查找 blockHistories 表中是否有重复的历史版本 version
      const hisItem = await db.blockHistories.where('[block_id+version]').equals([id, version]).limit(1).first()

      if (hisItem) {
        return [200, getResponseData({ error: '版本号已存在' })]
      }

      const updateTime = formatDateTime()
      const buildInfo ={
        result: true,
        versions: [
          version
        ],
        endTime: updateTime
      }
      block.is_published = true
      const {
        createdBy,
        lastUpdatedBy,
        tenantId,
        renterId,
        siteId,
        framework,
        assets,
        content, name_cn,
        screenshot,
        path,
        description,
        tags,
        is_official,
        is_default,
        platform_id,
        created_app,
        i18n,
        created_at,
        updated_at
      } = block
      // 2. 插入历史版本 version
      const historyItem = {
        block_id: id,
        createdBy,
        lastUpdatedBy,
        tenantId,
        renterId,
        siteId,
        version,
        current_version: version,
        message: deploy_info,
        label,
        name_cn,
        name: name_cn,
        framework,
        content,
        assets,
        buildInfo,
        screenshot,
        path,
        description,
        tags,
        is_official,
        is_default,
        platformId: platform_id,
        appId: created_app,
        i18n,
        created_at,
        updated_at
      }

      const historyId = await db.blockHistories.add(historyItem)

      // 3. 更新 block 信息
      block.updated_at = updateTime
      block.version = version
      block.last_build_info = buildInfo
      block.current_history = await db.blockHistories.get(historyId)

      await db.block.update(id, block)
      const blockDetail = await db.block.get(id)
      const histories = await db.blockHistories.where('block_id').equals(id).toArray()
      blockDetail.histories = histories

      return [200, getResponseData(blockDetail)]
    }
  },
  // 删除区块
  {
    url: /\/material-center\/api\/block\/delete\/\d+/,
    method: 'GET',
    response: async (config) => {
      const id = Number(config.url.split('/').pop())
      const blockItem = await db.block.get(id)

      const blockGroup = await db.blockGroup.toArray()
      blockGroup.map((blockGroupItem) => {
        if (blockGroupItem.blocks.includes(id)) {
          blockGroupItem.blocks = blockGroupItem.blocks.filter((item) => item !== id)
          db.blockGroup.update(blockGroupItem.id, blockGroupItem)
        }
      })
      // TODO: 已发布区块的删除逻辑？
      await db.block.delete(id)

      return [200, getResponseData(blockItem)]
    }
  },
  
  // 获取区块标签
  {
    // /material-center/api/block/tags
    url: /\/material-center\/api\/block\/tags/,
    method: 'GET',
    response: async () => {
      return [200, getResponseData([])]
    }
  },
  // 获取区块用户
  {
    // /material-center/api/block/users
    url: /\/material-center\/api\/block\/users/,
    method: 'GET',
    response: async () => {
      const users = await db.user.toArray()
      return [200, getResponseData(users)]
    }
  },
  // 获取区块租户
  {
    // /material-center/api/block/tenants
    url: /\/material-center\/api\/block\/tenants/,
    method: 'GET',
    response: async () => {
      const tenants = [
        {
          id: 1,
          orgCode: null,
          nameCn: "public",
          nameEn: "公共租户",
          description: "Default tenant for new user to explore.",
          createdTime: "2024-10-16 19:31:28",
          createdBy: 1,
          lastUpdatedBy: 1,
          lastUpdatedTime: "2024-10-16 19:31:28"
        }
      ]

      return [200, getResponseData(tenants)]
    }
  },
  // 查询不在指定分组的区块
  {
    url: /\/material-center\/api\/block\/notgroup\/\d+/,
    method: 'GET',
    response: async (config) => {
      const groupId = Number(config.url.split('/').pop())
      const allBlocks = await db.block.toArray()
      const publishedBlocks = allBlocks.filter((item) => item.is_published)
      const group = await db.blockGroup.get(groupId)
      const blockId = (group.materialBlocks || []).map((item) => item.id)
      const res = publishedBlocks.filter((item) => {
        return !blockId.includes(item.id)
      })

      return [200, getResponseData(res)]
    }
  },
  // 根据 label 查询区块
  {
    url: /\/material-center\/api\/block/,
    method: 'GET',
    response: async (config) => {
      const query = new URLSearchParams(config.url.split('?')[1])
      const label = query.get('label')
      if (!label) {
        return [200, getResponseData({}, { code: '', message: '缺少 label 参数' })]
      }
      const blockItem = await db.block.where('label').equals(label).toArray()
      await Promise.all(
        blockItem.map(async (item) => {
          const histories = await db.blockHistories.where('block_id').equals(item.id).toArray()
          item.histories = histories
        })
      )

      return [200, getResponseData(blockItem)]
    }
  }
]
