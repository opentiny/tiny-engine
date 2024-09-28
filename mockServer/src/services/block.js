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
export default class BlockService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/blocks.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'label',
      unique: true
    })

    this.userInfo = {
      id: 86,
      username: '开发者',
      email: 'developer@lowcode.com',
      resetPasswordToken: 'developer',
      confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
      is_admin: true
    }

    this.blockModel = {
      id: '',
      label: '',
      name_cn: '',
      framework: [],
      content: {},
      description: '',
      path: '',
      screenshot: '',
      created_app: '',
      tags: '',
      categories: [],
      occupier: {
        id: 86,
        username: '开发者',
        resetPasswordToken: 'developer'
      },
      isDefault: null,
      isOfficial: null
    }
  }

  async create(params) {
    const blockData = { ...this.blockModel, ...params }
    const result = await this.db.insertAsync(blockData)
    const { _id } = result
    await this.db.updateAsync({ _id }, { $set: { id: _id } })
    result.id = result._id
    return result
  }

  async update(id, params) {
    await this.db.updateAsync({ _id: id }, { $set: params })
    const result = await this.db.findOneAsync({ _id: id })
    return getResponseData(result)
  }

  async detail(blockId) {
    const result = await this.db.findOneAsync({ _id: blockId })

    return getResponseData(result)
  }

  async delete(blockId) {
    const result = await this.db.findOneAsync({ _id: blockId })
    await this.db.removeAsync({ _id: blockId })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.db.findAsync()
    return getResponseData(result)
  }

  async find(params) {
    const result = await this.db.findAsync(params)
    return result
  }
}
