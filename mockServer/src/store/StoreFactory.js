/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

const config = require('../config/config')
const NedbStore = require('./NedbStore')
const FileStore = require('./FileStore')

/**
 * Factory function to create the appropriate store instance based on configuration
 * @param {string} collectionName - Name of the collection (e.g., 'pages', 'apps')
 * @param {Object} options - Additional options for the store
 * @param {string[]} options.uniqueFields - Fields that should be unique
 * @returns {StoreAdapter} Store instance
 */
function createStore(collectionName, options = {}) {
  const dbMode = config.dbMode || 'db'

  if (dbMode === 'file') {
    return new FileStore(collectionName, options)
  } else {
    return new NedbStore(collectionName, options)
  }
}

module.exports = createStore
