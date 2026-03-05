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
const { getDatabasePath } = require('../tool/Common')
const NedbStore = require('./NedbStore')
const FileStore = require('./FileStore')

/**
 * Factory function to create the appropriate store instance based on configuration
 * @param {string} collectionName - Name of the collection (e.g., 'pages', 'apps')
 * @param {Object} options - Additional options for the store
 * @param {Array} options.indexes - Index configurations (e.g., [{ fieldName: 'route', unique: true }])
 * @returns {StoreAdapter} Store instance
 */
function createStore(collectionName, options = {}) {
  const dbMode = config.dbMode || 'db'

  if (dbMode === 'file') {
    // Pass dataPath from config
    return new FileStore(collectionName, config.fileDbPath, options)
  } else {
    // Build NeDB options with filename
    const nedbOptions = {
      filename: getDatabasePath(`${collectionName}.db`),
      ...options
    }
    return new NedbStore(nedbOptions)
  }
}

module.exports = createStore
