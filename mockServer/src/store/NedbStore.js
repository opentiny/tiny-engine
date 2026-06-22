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

const DateStore = require('@seald-io/nedb')
const StoreAdapter = require('./StoreAdapter')

/**
 * NeDB storage adapter implementation
 * Wraps @seald-io/nedb to provide standard storage interface
 */
class NedbStore extends StoreAdapter {
  constructor(options) {
    super()
    this.db = new DateStore({
      filename: options.filename,
      autoload: true
    })

    // Process indexes array (matches NeDB format)
    if (options.indexes && Array.isArray(options.indexes)) {
      options.indexes.forEach((indexConfig) => {
        this.db.ensureIndex(indexConfig)
      })
    }
  }

  async insert(data) {
    const result = await this.db.insertAsync(data)
    return result
  }

  async update(query, update, options = {}) {
    // Pass update operators directly and forward `multi` to NeDB. Default
    // multi:false matches the StoreAdapter/FileStore contract (single record).
    // Returns the count of affected records per the store contract.
    const { numAffected } = await this.db.updateAsync(query, update, { multi: options.multi === true })
    return numAffected
  }

  async find(query = {}) {
    const result = await this.db.findAsync(query)
    return result
  }

  async findOne(query) {
    const result = await this.db.findOneAsync(query)
    return result
  }

  async remove(query, options = {}) {
    // Forward `multi` to NeDB; default multi:false matches the store contract.
    // Returns the count of removed records.
    const numRemoved = await this.db.removeAsync(query, { multi: options.multi === true })
    return numRemoved
  }
}

module.exports = NedbStore
