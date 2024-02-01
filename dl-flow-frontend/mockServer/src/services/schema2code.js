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

import { pageService } from '../routes/main-routes'
import appInfo from './appinfo.json'

export default class Schema2CodeServcice {
  constructor() {
    this.blockHistories = appInfo.blockHistories
    this.components = appInfo.materialHistory.components
  }

  schema2code(pageInfo, type = 'page') {
    const { schema, name } = pageInfo
    return this.translateSchema({
      schema,
      name,
      type
    })
  }

  /**
   * 通过dsl 将页面/区块schema数据生成对应代码
   * @param { I_TranslateSchemaParam } params
   * @return {Promise<I_Response>} dsl函数返回数据
   */
  translateSchema(params) {
    const { schema, name, type, blockHistories = this.blockHistories, components = this.components } = params
    // 页面/区块 预览只需将页面、区块路径和区块构建产物路径统一设置为 ./components 即可
    const defaultMain = './components'
    let componentsMap = this.getComponentSchema(components)
    componentsMap = componentsMap.concat(this.getBlockSchema(blockHistories))
    componentsMap.forEach((component) => {
      if (component.main !== undefined) {
        component.main = defaultMain
      }
    })

    componentsMap.push({
      componentName: name,
      main: defaultMain
    })

    const { generateCode } = require('@opentiny/tiny-engine-dsl-vue')
    let code
    try {
      code = generateCode({
        pageInfo: { schema, name },
        blocksData: [],
        componentsMap
      })
    } catch (e) {
      this.getResponseData(null, e)
    }

    return this.getResponseData(code)
  }

  getResponseData(data, error) {
    const res = {
      data
    }

    if (error) {
      const err_code = error.code || ''
      res.error = {
        code: err_code,
        message: error.message || ''
      }
    }
    return res
  }

  getComponentSchema(components) {
    return components.map((component) => {
      const {
        component: componentName,
        npm: { package: packageName, exportName, version, destructuring } = {}
      } = component
      return {
        componentName,
        package: packageName,
        exportName,
        destructuring,
        version
      }
    })
  }

  // 将区块组装成schema数据
  getBlockSchema(blockHistories) {
    return blockHistories.map((blockHistory) => {
      const { path, version } = blockHistory
      // 每个区块历史记录必有content
      const { fileName: componentName } = blockHistory.content
      return {
        componentName,
        main: path || '',
        destructuring: false,
        version: version || 'N/A'
      }
    })
  }
}
