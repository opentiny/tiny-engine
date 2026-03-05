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

export default class BlockCategoryService {
  constructor() {
    this.store = createStore('blockCategories', {
      indexes: [{ fieldName: 'name', unique: true }],
      namingFields: ['name']
    })

    this.blockCategoriesModel = {
      id: '',
      app: '',
      name: '',
      desc: '',
      blocks: []
    }
  }

  async create(params) {
    const blockCategoriesData = { ...this.blockCategoriesModel, ...params }
    blockCategoriesData.app = appinfo.app
    const result = await this.store.insert(blockCategoriesData)
    const { _id } = result
    await this.store.update({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(result)
  }

  async update(id, params) {
    if (params?._id) {
      const categories = await this.store.findOne({ _id: id })
      if (categories) {
        categories.blocks.push(params._id)
        await this.store.update({ _id: id }, { $set: categories })
        return getResponseData(categories)
      }
    }
    params.app = appinfo.app
    await this.store.update({ _id: id }, { $set: params })

    const result = await this.store.findOne({ _id: id })
    return getResponseData(result)
  }

  async find(params) {
    const result = await this.store.find()
    return getResponseData(result)
  }

  async delete(id) {
    const result = await this.store.findOne({ _id: id })
    await this.store.remove({ _id: id })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.store.find()
    return getResponseData(result)
  }
}
