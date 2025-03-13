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
import fs from 'fs-extra'
import path from 'path'
import { getResponseData } from '../tool/Common'
import sources from '../assets/json/sources.json'
export default class soueceService {
  detail(id) {
    const sourceData = sources[id] || {}
    return getResponseData(sourceData)
  }

  update(source_global) {
    const appPath = path.join(__dirname, '../assets/json/appinfo.json')
    const detailPath = path.join(__dirname, '../mock/get/app-center/apps/detail/918.json')
    const appSchemaPath = path.join(__dirname, '../mock/get/app-center/v1/apps/schema/918.json')
    const appJson = fs.readJSONSync(appPath)
    const detailJson = fs.readJSONSync(detailPath)
    const schemaJson = fs.readJSONSync(appSchemaPath)
    appJson.app.data_source_global = source_global
    detailJson.data.data_source_global = source_global
    schemaJson.data.dataSource = {...schemaJson.data.dataSource, ...source_global}
    fs.outputJSONSync(appPath, appJson, { spaces: 2 })
    fs.outputJSONSync(detailPath, detailJson, { spaces: 2 })
    fs.outputJSONSync(appSchemaPath, schemaJson, { spaces: 2 })
  }
}