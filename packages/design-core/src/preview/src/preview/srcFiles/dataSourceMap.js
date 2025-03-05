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

import dataSources from './dataSource.js'

const dataSourceMap = {}

Array.isArray(dataSources.list) &&
  dataSources.list.forEach((config) => {
    const dataSource = { config: config.data }

    const result = {
      code: '',
      msg: 'success',
      data: {}
    }
    result.data =
      dataSource.config.type === 'array'
        ? { items: dataSource?.config?.data, total: dataSource?.config?.data?.length }
        : dataSource?.config?.data
    dataSourceMap[config.name] = dataSource

    dataSource.load = () => Promise.resolve(result)
  })

export default dataSourceMap
