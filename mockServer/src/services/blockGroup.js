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
import appinfo from '../assets/json/appinfo.json'

export default class BlockGroupService {
  constructor() {
    this.store = createStore('blockGroups', {
      indexes: [{ fieldName: 'name', unique: true }],
      namingFields: ['name']
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
    const result = await this.store.insert(blockGroupData)
    const { _id } = result
    await this.store.update({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(result)
  }

  async update(id, params) {
    params.app = appinfo.app
    await this.store.update({ _id: id }, { $set: params })

    const result = await this.store.findOne({ _id: id })
    return getResponseData(result)
  }

  async find(params) {
    if (params?.app || !params?.id) {
      const result = await this.store.find()
      return getResponseData(result)
    }
    const { id } = params
    const blockGroup = await this.store.findOne({ _id: id })
    return getResponseData([blockGroup])
  }

  async delete(blockGroupId) {
    const result = await this.store.findOne({ _id: blockGroupId })
    await this.store.remove({ _id: blockGroupId })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.store.find()
    return getResponseData(result)
  }
}
