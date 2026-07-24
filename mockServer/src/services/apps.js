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
    this.store = createStore('apps', {
      indexes: [{ fieldName: '_id', unique: true }],
      namingFields: ['name']
    })

    this.schemaStore = createStore('appsSchema', {
      indexes: [{ fieldName: '_id', unique: true }],
      namingFields: ['id']
    })

    this.appList = []
  }

  async create(params) {
    const all = await this.store.find({})
    const mockId = all.length > 0 ? Math.max(...all.map((item) => Number(item.id) || 0)) + 1 : 3
    const newApp = {
      ...defaultApp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      id: mockId,
      ...params
    }
    await this.store.insert(newApp)

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
    // App and schema live in different collections. If the schema write fails,
    // best-effort roll back the app insert so we don't leave a one-sided record,
    // then rethrow — ErrorRoutesCatch serializes thrown errors into the response.
    try {
      await this.schemaStore.insert(newAppSchema)
    } catch (err) {
      try {
        await this.store.remove({ id: newApp.id })
      } catch {
        /* swallow cleanup failure; surface the original error below */
      }
      throw err
    }
    return getResponseData(newApp)
  }

  async delete(id) {
    const result = await this.store.findOne({ id: Number(id) })
    await this.store.remove({ id: Number(id) })

    await this.schemaStore.remove({ id: Number(id) })
    return getResponseData(result)
  }

  async list(name, orderBy, createdBy) {
    let query = {}

    if (name) {
      query.name = { $regex: new RegExp(name, 'i') }
    }

    const result = await this.store.find(query)
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
    await this.store.update({ id: Number(id) }, { $set: params })
    const result = await this.store.findOne({ id: Number(id) })
    return getResponseData(result)
  }

  async find(id) {
    const result = await this.store.findOne({ id: Number(id) })
    return getResponseData(result)
  }

  async findSchema(id) {
    const result = await this.schemaStore.findOne({ id: Number(id) })
    let resultStr = JSON.stringify(result)
    resultStr = resultStr.replace(/"lowcode_/g, '"lowcode.')
    const modifiedResult = JSON.parse(resultStr)

    return { data: modifiedResult, locale: 'zh-cn' }
  }
}
