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

export default class TemplateService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/templates.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'id',
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

    this.templateModel = {
      name: '',
      id: '',
      app: '918',
      template_content: {},
      parentId: '',
      isTemplate: true,
      isDefault: false,
      occupier: {
        id: 86,
        username: '开发者',
        email: 'developer@lowcode.com',
        resetPasswordToken: 'developer',
        confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
        is_admin: true
      }
    }

    this.categoryModel = {
      id: '',
      parentId: '',
      name: 'test',
      app: '918',
      isTemplate: false
    }
  }

  async create(params) {
    const model = params.isTemplate ? this.templateModel : this.categoryModel
    const templateData = { ...model, ...params }
    const result = await this.db.insertAsync(templateData)
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

  async detail(templateId) {
    const result = await this.db.findOneAsync({ _id: templateId })
    return getResponseData(result)
  }

  async delete(templateId) {
    const result = await this.db.findOneAsync({ _id: templateId })
    await this.db.removeAsync({ _id: templateId })
    return getResponseData(result)
  }
}
