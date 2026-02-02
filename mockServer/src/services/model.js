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

import { getResponseData } from '../tool/Common'
import modelList from '../assets/json/model.json'

const defaultModel = {
  createdBy: '86',
  lastUpdatedBy: '86',
  tenantId: null,
  renterId: null,
  siteId: null,
  appId: null,
  platformId: 1,
  nameCn: 'test',
  nameEn: 'test',
  version: '1.0.0',
  modelUrl: '1',
  parameters: [],
  method: [
    {
      name: '新增方法',
      nameEn: 'insertApi',
      requestParameters: [
        {
          prop: 'nameEn',
          type: 'String',
          children: null
        },
        {
          prop: 'params',
          type: 'Object',
          children: []
        }
      ],
      responseParameters: [
        {
          prop: 'code',
          type: 'Number'
        },
        {
          prop: 'message',
          type: 'String'
        },
        {
          prop: 'data',
          type: 'Enum'
        }
      ]
    },
    {
      name: '修改方法',
      nameEn: 'updateApi',
      requestParameters: [
        {
          prop: 'nameEn',
          type: 'String',
          children: null
        },
        {
          prop: 'data',
          type: 'Object',
          children: []
        },
        {
          prop: 'params',
          type: 'Object',
          children: []
        }
      ],
      responseParameters: [
        {
          prop: 'code',
          type: 'Number'
        },
        {
          prop: 'message',
          type: 'String'
        },
        {
          prop: 'data',
          type: 'Enum'
        }
      ]
    },
    {
      name: '查询方法',
      nameEn: 'queryApi',
      requestParameters: [
        {
          prop: 'nameEn',
          type: 'String',
          children: null
        },
        {
          prop: 'currentPage',
          type: 'Number',
          children: null
        },
        {
          prop: 'pageSize',
          type: 'Number',
          children: null
        },
        {
          prop: 'nameCn',
          type: 'String',
          children: null
        },
        {
          prop: 'params',
          type: 'Object',
          children: []
        }
      ],
      responseParameters: [
        {
          prop: 'total',
          type: 'Number'
        },
        {
          prop: 'code',
          type: 'Number'
        },
        {
          prop: 'message',
          type: 'String'
        },
        {
          prop: 'data',
          type: 'Enum'
        }
      ]
    },
    {
      name: '删除方法',
      nameEn: 'deleteApi',
      requestParameters: [
        {
          prop: 'nameEn',
          type: 'String',
          children: null
        },
        {
          prop: 'id',
          type: 'Number',
          children: null
        }
      ],
      responseParameters: [
        {
          prop: 'code',
          type: 'Number'
        },
        {
          prop: 'message',
          type: 'String'
        },
        {
          prop: 'data',
          type: 'Enum'
        }
      ]
    }
  ],
  description: '',
  created_at: '2026-01-30 04:34:25',
  updated_at: '2026-01-30 04:34:25'
}

export default class AppsService {
  constructor() {
    this.modelList = modelList
  }

  async create(params) {
    let mockId =
      this.modelList.data.records.length > 0 ? Math.max(...this.modelList.data.records.map((item) => item.id)) + 1 : 3
    const newModel = {
      ...defaultModel,
      id: mockId++,
      ...params
    }
    this.modelList.data.records.push(newModel)
    return getResponseData(newModel)
  }

  async delete(id) {
    this.modelList.data.records = this.modelList.data.records.filter((item) => Number(item.id) !== Number(id))

    return getResponseData(this.modelList.data)
  }

  async list() {
    return getResponseData(this.modelList.data)
  }

  async update(id, params) {
    const index = this.modelList.data.records.findIndex((item) => Number(item.id) === Number(id))
    if (index === -1) {
      return getResponseData({ success: false, message: '未找到应用' })
    }

    this.modelList.data.records[index] = {
      ...this.modelList.data.records[index],
      ...params
    }

    return getResponseData(this.modelList.data.records[index])
  }
}
