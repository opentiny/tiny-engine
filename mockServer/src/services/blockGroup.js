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
import appinfo from '../assets/json/appinfo.json'
export default class BlockGroupService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/blockGroups.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'name',
      unique: true
    })

    this.blockGroupModel = {
      id: '',
      app: '',
      name: '',
      desc: '',
      blocks: []
    }
  }

  async create(params) {
    const blockGroupData = { ...this.blockGroupModel, ...params }
    blockGroupData.app = appinfo.app
    const result = await this.db.insertAsync(blockGroupData)
    const { _id } = result
    await this.db.updateAsync({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(result)
  }

  async update(id, params) {
    params.app = appinfo.app
    await this.db.updateAsync({ _id: id }, { $set: params })

    const result = await this.db.findOneAsync({ _id: id })
    return getResponseData(result)
  }

  async find(params) {
    if (params?.app || !params?.id) {
      const result = await this.db.findAsync()
      return getResponseData(result)
    }
    const { id } = params
    const blockGroup = await this.db.findOneAsync({ _id: id })
    return getResponseData([blockGroup])
  }

  async delete(blockGroupId) {
    const result = await this.db.findOneAsync({ _id: blockGroupId })
    await this.db.removeAsync({ _id: blockGroupId })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.db.findAsync()
    return getResponseData(result)
  }
}
