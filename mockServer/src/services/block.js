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
import createStore from '../store/StoreFactory'
import { getResponseData } from '../tool/Common'

export default class BlockService {
  constructor() {
    this.store = createStore('blocks', {
      indexes: [{ fieldName: 'label', unique: true }],
      namingFields: ['label', 'name']
    })

    this.userInfo = {
      id: 86,
      username: '开发者',
      email: 'demo@example.com',
      confirmationToken: null,
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
        username: '开发者'
      },
      isDefault: null,
      isOfficial: null
    }
  }

  async create(params) {
    const blockData = { ...this.blockModel, ...params }
    const result = await this.store.insert(blockData)
    const { _id } = result
    await this.store.update({ _id }, { $set: { id: _id } })
    result.id = result._id
    return result
  }

  async update(id, params) {
    await this.store.update({ _id: id }, { $set: params })
    const result = await this.store.findOne({ _id: id })
    return getResponseData(result)
  }

  async detail(blockId) {
    const result = await this.store.findOne({ _id: blockId })

    return getResponseData(result)
  }

  async delete(blockId) {
    const result = await this.store.findOne({ _id: blockId })
    await this.store.remove({ _id: blockId })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.store.find()
    return getResponseData(result)
  }

  async find(params) {
    const result = await this.store.find(params)
    return result
  }
}
