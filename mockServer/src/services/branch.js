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

export default class BranchService {
  constructor() {
    this.db = new DateStore({
      filename: getDatabasePath('branch.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'name',
      unique: true
    })

    this.branchModel = {
      id: '',
      name: '',
      type: 'feature', // 默认
      status: 'active', //默认
      headCommitId: '',
      baseCommitId: '',
      creator: { id: 0, username: '', email: '' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: '',
      upstreamBranchId: undefined,
      downstreamBranchIds: [],
      lastCommitAt: undefined,
      commitsCount: 0,
      commitsAhead: 0,
      commitsBehind: 0,
      protection: undefined,
      metadata: {}
    }
  }

  async create(params) {
    const branchData = { ...this.branchModel, ...params }
    const result = await this.db.insertAsync(branchData)
    return getResponseData(result)
  }

  async update(id, params) {
    await this.db.updateAsync({ _id: id }, { $set: params })
    const result = await this.db.findOneAsync({ _id: id })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.db.findAsync()
    return getResponseData(result)
  }

  async delete(id) {
    const result = await this.db.findOneAsync({ _id: id })
    await this.db.removeAsync({ _id: id })
    return getResponseData(result)
  }

  async find(params) {
    const result = await this.db.findAsync()
    return getResponseData(result)
  }
}
