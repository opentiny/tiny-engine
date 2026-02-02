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

import { getResponseData } from '../tool/Common'
import list from '../assets/json/apps.json'

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
    this.appList = { ...list }
  }

  async create(params) {
    let mockId = this.appList.apps.length > 0 ? Math.max(...this.appList.apps.map((item) => item.id)) + 1 : 3
    const newApp = {
      ...defaultApp,
      id: mockId++,
      ...params
    }
    this.appList.apps.push(newApp)
    return getResponseData(newApp)
  }

  async delete(id) {
    this.appList.apps = this.appList.apps.filter((item) => Number(item.id) !== Number(id))
   
    return getResponseData(this.appList)
  }

  async list() {
    return getResponseData(this.appList)
  }

  async update(id, params) {
    const index = this.appList.apps.findIndex((item) => Number(item.id) === Number(id))
    if (index === -1) {
      return getResponseData({ success: false, message: '未找到应用' })
    }

    this.appList.apps[index] = {
      ...this.appList.apps[index],
      ...params
    }

    return getResponseData(this.appList.apps[index])
  }
}
