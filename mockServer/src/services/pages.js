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

export default class PageService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/pages.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'route',
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

    this.pageModel = {
      name: '',
      id: '',
      app: '918',
      route: '',
      page_content: {},
      tenant: 1,
      isBody: true,
      parentId: '',
      depth: 0,
      isPage: true,
      isDefault: false,
      group: 'staticPages',
      occupier: {
        id: 86,
        username: '开发者',
        email: 'developer@lowcode.com',
        resetPasswordToken: 'developer',
        confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
        is_admin: true
      }
    }

    this.folderModel = {
      parentId: '0',
      route: 'test',
      name: 'test',
      app: '918',
      isPage: false,
      group: 'staticPages'
    }
  }

  async create(params) {
    const model = params.isPage ? this.pageModel : this.folderModel
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

  async list(appId) {
    const result = await this.db.findAsync({ app: appId.toString() })
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
