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

export default class CommitService {
  constructor() {
    this.db = new DateStore({
      filename: getDatabasePath('commit.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: 'id',
      unique: true
    })

    this.commitModel = {
      id: '',
      message: '',
      author: { id: 0, username: '', email: '' },
      committer: { id: 0, username: '', email: '' },
      timestamp: Date.now(),
      parentCommits: [],
      branchId: '',
      schema: {},
      tags: [],
      verified: false,
      stats: { added: 0, modified: 0, deleted: 0 }
    }

    this.initData()
  }

  async initData() {
    const count = await this.db.countAsync({})
    if (count === 0) {
      console.log('初始化分支数据...')
      const defaultCommit = require('./commit.json')
      try {
        await this.db.insertAsync(defaultCommit)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('插入失败，唯一索引冲突:', err.message)
      }
    }
  }

  async create(params) {
    const commitData = { app: '1', ...this.commitModel, ...params }
    const result = await this.db.insertAsync(commitData)
    return getResponseData(result)
  }

  async update(id, params) {
    await this.db.updateAsync({ id: id }, { $set: params })
    const result = await this.db.findOneAsync({ id: id })
    return getResponseData(result)
  }

  async list(appId) {
    const result = await this.db.findAsync({ app: appId.toString() })
    return getResponseData(result)
  }

  async delete(id) {
    const result = await this.db.findOneAsync({ id: id })
    await this.db.removeAsync({ id: id })
    return getResponseData(result)
  }

  async detail(id) {
    const result = await this.db.findOneAsync({ id: id })
    return getResponseData(result)
  }
}
