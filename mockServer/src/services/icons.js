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

export default class IconService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/icons.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'prefix',
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

    this.iconModel = {
      name: 'home',
      body: '<path d="M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8h5z" fill="currentColor"/>',
      width: 24,
      height: 24
    }

    this.collectionModel = {
      name: 'test图标库',
      prefix: 'test',
      icons: {},
      occupier: {
        id: 86,
        username: '开发者',
        email: 'developer@lowcode.com',
        resetPasswordToken: 'developer',
        confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
        is_admin: true
      }
    }
  }

  async collectionList() {
    const result = await this.db.findAsync({})
    return getResponseData(result)
  }
  async collectionCreate() {}
  async collectionRemove() {}
  async collectionImport({ prefix, name, iconify }) {
    const result = await this.db.insertAsync({ prefix, name, ...iconify, occupier: this.userInfo })
    return getResponseData(result)
  }

  async iconImport() {}
  async iconRemove() {}

  async create(params) {
    const model = params.isPage ? this.iconModel : this.collectionModel
    const pageData = { ...model, ...params }
    const result = await this.db.insertAsync(pageData)
    const { _id } = result
    await this.db.updateAsync({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(result)
  }

  async update(id, params) {
    await this.db.updateAsync({ _id: id }, { $set: params })
    const result = await this.db.findOneAsync({ _id: id })
    return getResponseData(result)
  }

  async collections() {
    const result = await this.db.findAsync()
    return getResponseData(result)
  }

  async detail(pageId) {
    const result = await this.db.findOneAsync({ _id: pageId })
    return getResponseData(result)
  }

  async delete(pageId) {
    const result = await this.db.findOneAsync({ _id: pageId })
    await this.db.removeAsync({ _id: pageId })
    return getResponseData(result)
  }
}
