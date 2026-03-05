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

/**
 * Base class for storage adapters
 * Defines the standard interface that all storage implementations must follow
 */
class StoreAdapter {
  /**
   * Insert a single record
   * @param {Object} data - The data to insert
   * @returns {Promise<Object>} The inserted record with generated ID
   */
  async insert(data) {
    throw new Error('insert() must be implemented by subclass')
  }

  /**
   * Update records matching the query
   * @param {Object} query - Query criteria
   * @param {Object} update - Update operations (e.g., { $set: {...} })
   * @returns {Promise<number>} Number of records updated
   */
  async update(query, update) {
    throw new Error('update() must be implemented by subclass')
  }

  /**
   * Find multiple records matching the query
   * @param {Object} query - Query criteria
   * @returns {Promise<Array>} Array of matching records
   */
  async find(query) {
    throw new Error('find() must be implemented by subclass')
  }

  /**
   * Find a single record matching the query
   * @param {Object} query - Query criteria
   * @returns {Promise<Object|null>} The matching record or null
   */
  async findOne(query) {
    throw new Error('findOne() must be implemented by subclass')
  }

  /**
   * Remove records matching the query
   * @param {Object} query - Query criteria
   * @returns {Promise<number>} Number of records removed
   */
  async remove(query) {
    throw new Error('remove() must be implemented by subclass')
  }

  /**
   * Ensure an index on a field (for unique constraints, etc.)
   * @param {Object} options - Index options (e.g., { fieldName: 'route', unique: true })
   */
  ensureIndex(options) {
    // Optional: some stores may not need this
  }
}

module.exports = StoreAdapter
