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

import semver from 'semver'
import { mockService as services } from '../routes/main-routes'
// 查询当前区块全部子区块的 content_blocks
export const findAllContentBlocks = async (id) => {
  const blockInfo = await services.blockService.detail({ _id: id })
  const contentBlocks = await findContentBlockHistories(blockInfo.content_blocks)
  return {
    content_blocks: contentBlocks
  }
}

export const findContentBlockHistories = async (contentBlocks) => {
  const blockHistories = await findBlockHistoriesByContent(contentBlocks)
  if (!blockHistories) {
    return null
  }
  // 提炼content_blocks
  const subContentBlocks = blockHistories
    .map(({ content_blocks }) => content_blocks)
    .filter((item) => Boolean(item))
    .flat()
  if (subContentBlocks.length) {
    return deduplicateContentBlocks(subContentBlocks.concat(contentBlocks))
  }
  // 对全部的content_blocks 进行去重合并
  return contentBlocks
}

// 根据content_blocks 查询区块构建产物数据
export const findBlockHistoriesByContent = async (contentBlocks) => {
  if (!Array.isArray(contentBlocks) || contentBlocks.length < 1) {
    return null
  }
  // 获取contentBlocks 对应的 区块构建产物id
  const blockHistoriesId = await getBlockHistoryIdBySemver(contentBlocks)
  return blockHistoryService.find({
    _id: { $in: blockHistoriesId }
  })
}

/**
 * 有版本控制的利用 semver 比较版本信息， 得到 historyId 数组。 没有版本控制的返回最新的历史记录id。
 * @param {Array<any>} blocksVersionCtl 区块id-区块版本控制的数据集合 [ {block：995,version：'~1.0.1'}, ....]
 * @param {Array<number>} 区块历史记录id数组
 */
export const getBlockHistoryIdBySemver = async (blocksVersionCtl) => {
  // 根据 区块id - 区块版本控制 制作map 映射
  const blockVersionCtlMap = new Map()
  for (const { block, version } of blocksVersionCtl) {
    blockVersionCtlMap.set(block, version)
  }
  // 获取 区块id-区块历史记录id-区块历史记录版本 集合  [{blockId:995,historyId:1145,version: '1.0.4'}]
  const blockHistories = await getUnpkgBlockHistoriesByBlocksId(blocksVersionCtl.map((item) => item.block))
  // 将 集合序列化为 综合信息映射(区块id 为key 的map, map 中保存了 k-v 为 区块版本-区块历史id的map 和 版本数组)
  const blockHistoriesMap = formatBlocksVersionMap(blockHistories)
  // 要返回的历史记录集合
  const historiesId = []

  // 遍历区块历史记录 综合信息映射关系
  for (const [blockId, { historyMap, versions }] of blockHistoriesMap) {
    const versionCtl = blockVersionCtlMap.get(blockId)
    // 默认先取最新的
    let targetVersion = versions[versions.length - 1]
    if (versionCtl) {
      targetVersion = semver.maxSatisfying(versions, versionCtl)
    }
    const historyId = historyMap.get(targetVersion)
    if (historyId) {
      historiesId.push(historyId)
    }
  }
  // 返回历史记录集合
  return historiesId
}

/**
 * 查询区块id 下的全部区块历史记录
 * @param {Array<number>} blocksId 区块id数组
 * @returns {Promise<any>} 区块对应的区块历史版本
 */
const getUnpkgBlockHistoriesByBlocksId = async (blocksId) => {
  const ids = blocksId.length ? blocksId : [0]
  const data = await services.blockHistoryService.find(
    {
      version: { $ne: null, $ne: 'N/A' },
      block_id: { $in: ids }
    },
    {
      blockId: 1, // todo
      id: 1,
      version: 1
    }
  )
  return data?.[0] || []
}

/**
 * 序列化区块历史版本查询数据
 * @param { Array<any> } blocksVersion 区块历史记录版本数据
 * @return {Map<number, any>} 返回用于计算版本的map
 */
const formatBlocksVersionMap = (blocksVersion) => {
  const blocksVersionMap = new Map()
  for (const { blockId, historyId, version } of blocksVersion) {
    const item = blocksVersionMap.get(blockId) ?? {
      historyMap: new Map(),
      versions: []
    }
    item.historyMap.set(version, historyId)
    item.versions.push(version)
    blocksVersionMap.set(blockId, item)
  }
  return blocksVersionMap
}

// 对全部子区块的content_blocks 去重，暂时先用高版本优先
const deduplicateContentBlocks = (contentBlocks) => {
  const resMap = new Map()
  contentBlocks.forEach(({ block, version }) => {
    const item = resMap.get(block)
    if (item && item.version !== 'x') {
      if (versionAGteVersionB(version, item.version)) {
        // 用最大范围 或 最高版本的信息 覆盖旧有的
        resMap.set(block, { block, version })
      }
    } else {
      resMap.set(block, { block, version })
    }
  })

  return Array.from(resMap.values())
}

// 判断两个版本号或范围，谁更高、更广
const versionAGteVersionB = (a, b) => {
  // 判断 b 是否为 a版本的子集
  if (semver.subset(b, a)) {
    return true
  }
  // 再判断 a 是否为 b 的子集
  if (semver.subset(a, b)) {
    return false
  }
  // 二者没有版本子集关系，看谁的minVersion 大
  const minVersionA = semver.minVersion(a)
  const minVersionB = semver.minVersion(b)
  return semver.gte(minVersionA.version, minVersionB.version)
}
