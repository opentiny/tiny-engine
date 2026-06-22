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
import config from '../config/config'
import { getResponseData } from '../tool/Common'

const formatPageContentForStorage = (pageContent) => {
  if (pageContent === undefined) {
    return pageContent
  }

  if (config.dbMode === 'file') {
    if (typeof pageContent === 'string') {
      try {
        return JSON.parse(pageContent)
      } catch (e) {
        return pageContent
      }
    }
    return pageContent
  }

  if (pageContent && typeof pageContent === 'object') {
    return JSON.stringify(pageContent)
  }

  return pageContent
}

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
    this.store = createStore('pages', {
      indexes: [{ fieldName: '_id', unique: true }],
      namingFields: ['name']
    })

    this.userInfo = {
      id: 86,
      username: '开发者',
      email: 'demo@example.com',
      confirmationToken: null,
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
        email: 'demo@example.com',
        confirmationToken: null,
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

    const existing = await this.store.findOne({
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

    pageData.page_content = formatPageContentForStorage(pageData.page_content)

    const result = await this.store.insert(pageData)
    const { _id } = result
    await this.store.update({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(parsePageContent(result))
  }

  async update(id, params) {
    const updateData = { ...params }

    if (Object.prototype.hasOwnProperty.call(updateData, 'page_content')) {
      updateData.page_content = formatPageContentForStorage(updateData.page_content)
    }

    await this.store.update({ _id: id }, { $set: updateData })
    const result = await this.store.findOne({ _id: id })
    return getResponseData(parsePageContent(result))
  }

  async list(appId) {
    const result = await this.store.find({ app: appId.toString() })
    if (Array.isArray(result)) {
      result.forEach(parsePageContent)
    }
    return getResponseData(result)
  }

  async detail(pageId) {
    const result = await this.store.findOne({ _id: pageId })
    return getResponseData(parsePageContent(result))
  }

  async delete(pageId) {
    const result = await this.store.findOne({ _id: pageId })
    await this.store.remove({ _id: pageId })
    return getResponseData(parsePageContent(result))
  }
}
