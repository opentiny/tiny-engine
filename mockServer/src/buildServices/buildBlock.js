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

import { getResponseData } from '../tool/Common'
import logger from '../logger'
import BlockBuilder from './blockBuilder'
import { E_TASK_STATUS, E_TASK_TYPE } from '../tool/constants'
export default class BuildBlock {
  constructor(injectServices) {
    this.mockService = injectServices
    this.blockBuilder = new BlockBuilder(injectServices)
  }
  async build(params) {
    // post参数校验二次丰富
    const { deploy_info: message, block, version, needToSave = false } = params
    const { content } = block

    if (!content) {
      const error = {
        code: 'CM204',
        message: '区块构建参数缺少必须内容(content)'
      }
      return getResponseData('', error)
    }

    // 区块不存在的情况下先创建新区块
    const id = await this.ensureBlockId(block)
    // 对版本号是否存在进行校验
    const hasHistory = await this.mockService.blockHistoryService.isHistoryExisted(id, version)
    if (hasHistory) {
      const error = {
        code: 'CM205',
        message: '区块构建产物的版本已经存在'
      }
      return getResponseData('', error)
    }
    // 处理区块截图
    //block.screenshot = await materialCenter.block.handleScreenshot(block);
    // 更新i18n 信息
    //block.i18n = await materialCenter.block.getBlockI18n(id);

    const newTask = {
      taskTypeId: E_TASK_TYPE.BLOCK_BUILD,
      taskStatus: E_TASK_STATUS.INIT,
      uniqueId: id,
      taskName: block.label
    }
    const taskInfo = await this.mockService.taskService.create(newTask)
    const publishBool = this.blockBuilder.start(id, taskInfo.data.id, { message, block, version, needToSave })

    logger.info(`publish block ${publishBool ? 'success' : 'failed'}`)

    return taskInfo
  }

  async ensureBlockId(blockData) {
    const { id, label } = blockData
    if (id) {
      return id
    }
    // 如果区块不存在查询区块
    const blockInfo = await this.mockService.blockService.find({ label })
    const block = blockInfo.data[0] ?? {}
    if (block.id) {
      return block.id
    }
    // 区块不存在创建
    const newBlock = await this.mockService.blockService.create(blockData)
    return newBlock.data.id ?? 0
  }
}
