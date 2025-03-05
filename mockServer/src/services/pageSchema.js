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

import { E_SchemaFormatFunc } from './utils'
import { getResponseData } from '../tool/Common'

const config = {
  pageMeta: {
    convert: {
      page_desc: 'description',
      route: 'router',
      isBody: 'rootElement',
      createdBy: 'creator',
      created_at: 'gmt_create',
      updated_at: 'gmt_modified'
    },
    include: [
      'id',
      'title',
      'page_desc',
      'createdBy',
      'parentId',
      'created_at',
      'updated_at',
      'isHome',
      'isBody',
      'group',
      'route',
      'occupier'
    ],
    format: {
      created_at: E_SchemaFormatFunc.ToLocalTimestamp,
      updated_at: E_SchemaFormatFunc.ToLocalTimestamp,
      isBody: E_SchemaFormatFunc.ToRootElement,
      group: E_SchemaFormatFunc.ToGroupName,
      createdBy: E_SchemaFormatFunc.ToCreatorName
    }
  },
  pageContent: {
    include: ['fileName', 'componentName', 'props', 'css', 'children', 'methods', 'state', 'lifeCycles']
  },
  folder: {
    convert: {
      name: 'folderName',
      route: 'router',
      created_at: 'gmt_create',
      updated_at: 'gmt_modified'
    },
    include: ['name', 'route', 'created_at', 'updated_at', 'id', 'parentId', 'depth'],
    format: {
      created_at: E_SchemaFormatFunc.ToLocalTimestamp,
      updated_at: E_SchemaFormatFunc.ToLocalTimestamp
    }
  }
}

export default class PageSchemaService {
  constructor() {
    this.config = config
  }

  assembleFields(originalData, type) {
    let dataCopy = JSON.parse(JSON.stringify(originalData.data))
    const conf = this.config[type]
    if (conf.include || conf.exclude) {
      dataCopy = this.filterFields(dataCopy, conf)
    }
    if (conf.format) {
      dataCopy = this.formatFields(dataCopy, conf)
    }
    if (conf.convert) {
      dataCopy = this.convertFields(dataCopy, conf)
    }
    return getResponseData(dataCopy)
  }

  // 转换数据表字段为schema中的字段命名
  convertFields(data, conf) {
    const convertConf = conf.convert || {}
    Object.keys(convertConf).forEach((key) => {
      data[convertConf[key]] = data[key]
      delete data[key]
    })
    return data
  }

  // 筛选数据
  filterFields(data, conf) {
    const excludeConf = conf.exclude || []
    const includeConf = conf.include || []
    let res = {}
    // include 优先级高于 exclude
    if (includeConf.length) {
      for (const key in data) {
        if (includeConf.includes(key)) {
          res[key] = data[key]
        }
      }
    } else if (excludeConf.length) {
      for (const key in data) {
        if (!excludeConf.includes(key)) {
          res[key] = data[key]
        }
      }
    } else {
      res = data
    }

    return res
  }

  // 格式化数据
  formatFields(data, conf) {
    const { format = {} } = conf
    Object.keys(format).forEach((key) => {
      const funcName = format[key]
      const func = this[funcName]
      if (func) {
        data[key] = func(data[key])
      }
    })
    return data
  }

  // 获取页面元数据
  getSchemaMeta(pageData) {
    return this.assembleFields(pageData, 'pageMeta')
  }

  // 提取page_schema
  getSchemaBase(pageData) {
    const pageMate = JSON.parse(JSON.stringify(pageData.data))
    const pageContent = pageMate.page_content || {}
    pageContent.fileName = pageMate.name
    return this.assembleFields(
      {
        data: pageContent
      },
      'pageContent'
    )
  }

  // 获取folder schema数据 todo
  getFolderSchema(param) {
    const schema = this.assembleFields(
      {
        data: param
      },
      'folder'
    )
    schema.data.componentName = 'Folder'
    return schema
  }

  // 获取页面的schema
  getSchema(pageInfo) {
    const pageInfoData = {
      data: pageInfo
    }
    if (!pageInfo.isPage) {
      return this.getFolderSchema(pageInfo)
    }
    const schema = this.getSchemaBase(pageInfoData).data
    // 从page_schema中获取基本字段
    schema.meta = this.getSchemaMeta(pageInfoData).data
    return getResponseData(schema)
  }
}
