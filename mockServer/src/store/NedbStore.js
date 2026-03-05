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
import StoreAdapter from './StoreAdapter'

/**
 * NeDB storage adapter implementation
 * Wraps @seald-io/nedb to provide standard storage interface
 */
export default class NedbStore extends StoreAdapter {
  constructor(options) {
    super()
    this.db = new DateStore({
      filename: options.filename,
      autoload: true
    })

    // Setup unique indexes if specified
    if (options.uniqueFields && Array.isArray(options.uniqueFields)) {
      options.uniqueFields.forEach((fieldName) => {
        this.db.ensureIndex({
          fieldName,
          unique: true
        })
      })
    }
  }

  async insert(data) {
    const result = await this.db.insertAsync(data)
    return result
  }

  async update(query, data) {
    await this.db.updateAsync(query, { $set: data })
    const result = await this.db.findOneAsync(query)
    return result
  }

  async find(query = {}) {
    const result = await this.db.findAsync(query)
    return result
  }

  async findOne(query) {
    const result = await this.db.findOneAsync(query)
    return result
  }

  async remove(query) {
    const result = await this.db.findOneAsync(query)
    await this.db.removeAsync(query)
    return result
  }
}
