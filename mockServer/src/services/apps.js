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
import defaultAppSchema from '../mock/get/app-center/v1/apps/schema/16.json'

const defaultApp = {
  createdBy: '86',
  lastUpdatedBy: '86',
  tenantId: '1',
  renterId: null,
  siteId: null,
  name: 'dashboard',
  appWebsite: null,
  platformHistoryId: '1',
  publishUrl: null,
  editorUrl: null,
  visitUrl: null,
  assetsUrl: 'template-cover-1',
  state: null,
  homePage: null,
  css: null,
  config: {},
  constants: null,
  dataHandler: {},
  description: '',
  latest: null,
  gitGroup: null,
  projectName: null,
  branch: null,
  isDemo: null,
  isDefault: null,
  templateType: null,
  isTemplate: null,
  industryId: null,
  sceneId: null,
  setTemplateTime: null,
  setTemplateBy: null,
  setDefaultBy: null,
  framework: 'Vue',
  defaultLang: null,
  extendConfig: {},
  dataHash: null,
  canAssociate: null,
  industry: [],
  scene: [],
  platform: 1,
  image_url: null,
  published: false,
  global_state: [],
  data_source_global: {}
}

export default class AppsService {
  constructor() {
    this.db = new DateStore({
      filename: getDatabasePath('apps.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: '_id',
      unique: true
    })

    this.schemaDb = new DateStore({
      filename: getDatabasePath('appsSchema.db'),
      autoload: true
    })

    this.schemaDb.ensureIndex({
      fieldName: '_id',
      unique: true
    })

    this.appList = []
  }

  async create(params) {
    let mockId = this.appList.length > 0 ? Math.max(...this.appList.map((item) => item.id)) + 1 : 3
    const newApp = {
      ...defaultApp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: mockId++,
      ...params
    }
    this.db.insert(newApp)

    let resultStr = JSON.stringify(defaultAppSchema.data)
    resultStr = resultStr.replace(/"lowcode./g, '"lowcode_')
    const modifiedResult = JSON.parse(resultStr)
    const newAppSchema = {
      ...modifiedResult,
      meta: {
        ...modifiedResult.meta,
        name: params.name,
        description: params.description,
        appId: String(newApp.id),
        gmt_create: newApp.created_at,
        gmt_modified: newApp.updated_at
      },
      id: newApp.id
    }
    this.schemaDb.insert(newAppSchema)
    return getResponseData(newApp)
  }

  async delete(id) {
    const result = await this.db.findOneAsync({ id: Number(id) })
    await this.db.removeAsync({ id: Number(id) })

    await this.schemaDb.removeAsync({ id: Number(id) })
    return getResponseData(result)
  }

  async list(name, orderBy, createdBy) {
    let query = {}

    if (name) {
      query.name = { $regex: new RegExp(name, 'i') }
    }

    const result = await this.db.findAsync(query)
    this.appList = result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    if (createdBy) {
      this.appList = this.appList.filter((item) => item.createdBy === '86')
    }

    if (orderBy === 'last_updated_time') {
      this.appList.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at))
    }

    return getResponseData({ apps: this.appList })
  }

  async update(id, params) {
    await this.db.updateAsync({ id: Number(id) }, { $set: params })
    const result = await this.db.findOneAsync({ id: Number(id) })
    return getResponseData(result)
  }

  async find(id) {
    const result = await this.db.findOneAsync({ id: Number(id) })
    return getResponseData(result)
  }

  async findSchema(id) {
    const result = await this.schemaDb.findOneAsync({ id: Number(id) })
    let resultStr = JSON.stringify(result)
    resultStr = resultStr.replace(/"lowcode_/g, '"lowcode.')
    const modifiedResult = JSON.parse(resultStr)

    return { data: modifiedResult, locale: 'zh-cn' }
  }
}
