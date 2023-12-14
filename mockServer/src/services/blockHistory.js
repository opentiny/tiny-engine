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

import path from 'path'
import DateStore from '@seald-io/nedb'
import { getResponseData } from '../tool/Common'
export default class BlockHistoryService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/blockHistory.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'name',
      unique: true
    })

    this.blockHistoryModel = {
      id: '',
      message: '',
      content: null,
      assets: null,
      build_info: null,
      screenshot: null,
      path: '',
      label: '',
      description: null,
      mode: '',
      block_id: null
    }
  }

  async create(params) {
    const blockHistoryData = { ...this.blockHistoryModel, ...params }
    const result = await this.db.insertAsync(blockHistoryData)
    const { _id } = result
    await this.db.updateAsync({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(result)
  }

  async find(params) {
    const blockHistory = await this.db.findAsync(params)
    return getResponseData(blockHistory)
  }

  async isHistoryExisted(blockId, version) {
    const history = await this.db.findAsync({ block_id: blockId, version })
    return !!history?.length
  }
}
