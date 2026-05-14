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

import DateStore from '@seald-io/nedb'
import { getDatabasePath, getResponseData } from '../tool/Common'

const parsePageContent = (item) => {
  if (item && item.page_content && typeof item.page_content === 'string') {
    try {
      item.page_content = JSON.parse(item.page_content)
    } catch (e) {
      // ignore
    }
  }
  return item
}

export default class PageService {
  constructor() {
    this.db = new DateStore({
      filename: getDatabasePath('pages.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: '_id',
      unique: true
    })

    this.userInfo = {
      id: 86,
      username: '开发者',
      email: 'developer@lowcode.com',
      confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
      is_admin: true
    }

    this.pageModel = {
      name: '',
      id: '',
      app: '1',
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
        confirmationToken: 'dfb2c162-351f-4f44-ad5f-8998',
        is_admin: true
      }
    }

    this.folderModel = {
      parentId: '0',
      route: 'test',
      name: 'test',
      app: '1',
      isPage: false,
      group: 'staticPages'
    }
  }

  async create(params) {
    const model = params.isPage ? this.pageModel : this.folderModel
    const pageData = { ...model, ...params }

    if (!pageData.route) {
      pageData.route = pageData.name || 'Untitled'
    }

    const existing = await this.db.findOneAsync({
      app: pageData.app.toString(),
      route: pageData.route
    })

    if (existing) {
      return getResponseData(null, {
        code: 'ROUTE_CONFLICT',
        message: `Route "${pageData.route}" already exists in app "${pageData.app}"`,
        status: 409
      })
    }

    if (pageData.page_content && typeof pageData.page_content === 'object') {
      pageData.page_content = JSON.stringify(pageData.page_content)
    }

    const result = await this.db.insertAsync(pageData)
    const { _id } = result
    await this.db.updateAsync({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(parsePageContent(result))
  }

  async update(id, params) {
    const updateData = { ...params }
    if (updateData.page_content && typeof updateData.page_content === 'object') {
      updateData.page_content = JSON.stringify(updateData.page_content)
    }

    await this.db.updateAsync({ _id: id }, { $set: updateData })
    const result = await this.db.findOneAsync({ _id: id })
    return getResponseData(parsePageContent(result))
  }

  async list(appId) {
    const result = await this.db.findAsync({ app: appId.toString() })
    if (Array.isArray(result)) {
      result.forEach(parsePageContent)
    }
    return getResponseData(result)
  }

  async detail(pageId) {
    const result = await this.db.findOneAsync({ _id: pageId })

    return getResponseData(parsePageContent(result))
  }

  async delete(pageId) {
    const result = await this.db.findOneAsync({ _id: pageId })

    await this.db.removeAsync({ _id: pageId })
    return getResponseData(parsePageContent(result))
  }
}
