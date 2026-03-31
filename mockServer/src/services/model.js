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
import { getDatabasePath, getResponseData } from '../tool/Common'

const defaultModel = {
  createdBy: '1',
  lastUpdatedBy: '1',
  tenantId: null,
  renterId: null,
  siteId: null,
  appId: null,
  platformId: 1,
  nameCn: '',
  nameEn: '',
  version: '1.0.0',
  modelUrl: 'https://agent-alpha.opentiny.design/platform-center/api/model-data',
  parameters: [
    {
      prop: 'id',
      isModel: false,
      type: 'Number',
      required: true,
      description: '主键'
    },
    {
      prop: 'name',
      isModel: false,
      type: 'String',
      required: true,
      description: '姓名'
    },
    {
      prop: 'status',
      isModel: false,
      type: 'Enum',
      options: '[{"value":"1","label":"已转正"},{"value":"0","label":"未转正"}]',
      required: true,
      description: '状态'
    },
    {
      prop: 'test',
      type: 'String',
      required: false,
      description: ''
    }
  ],
  method: [
    {
      name: '新增方法',
      nameEn: 'insertApi',
      requestParameters: [
        {
          prop: 'nameEn',
          type: 'String'
        },
        {
          prop: 'params',
          type: 'Object',
          children: [
            {
              prop: 'id',
              isModel: false,
              type: 'Number',
              required: true,
              description: '主键'
            },
            {
              prop: 'name',
              isModel: false,
              type: 'String',
              required: true,
              description: '姓名'
            },
            {
              prop: 'status',
              isModel: false,
              type: 'Enum',
              options: '[{"value":"1","label":"已转正"},{"value":"0","label":"未转正"}]',
              required: true,
              description: '状态'
            },
            {
              prop: 'test',
              type: 'String',
              required: false,
              description: ''
            }
          ]
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
          type: 'String'
        },
        {
          prop: 'data',
          type: 'Object',
          children: [
            {
              prop: 'id',
              isModel: false,
              type: 'Number',
              required: true,
              description: '主键'
            },
            {
              prop: 'name',
              isModel: false,
              type: 'String',
              required: true,
              description: '姓名'
            },
            {
              prop: 'status',
              isModel: false,
              type: 'Enum',
              options: '[{"value":"1","label":"已转正"},{"value":"0","label":"未转正"}]',
              required: true,
              description: '状态'
            },
            {
              prop: 'test',
              type: 'String',
              required: false,
              description: ''
            }
          ]
        },
        {
          prop: 'params',
          type: 'Object',
          children: [
            {
              prop: 'id',
              isModel: false,
              type: 'Number',
              required: true,
              description: '主键'
            },
            {
              prop: 'name',
              isModel: false,
              type: 'String',
              required: true,
              description: '姓名'
            },
            {
              prop: 'status',
              isModel: false,
              type: 'Enum',
              options: '[{"value":"1","label":"已转正"},{"value":"0","label":"未转正"}]',
              required: true,
              description: '状态'
            },
            {
              prop: 'test',
              type: 'String',
              required: false,
              description: ''
            }
          ]
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
          type: 'String'
        },
        {
          prop: 'currentPage',
          type: 'Number'
        },
        {
          prop: 'pageSize',
          type: 'Number'
        },
        {
          prop: 'nameCn',
          type: 'String'
        },
        {
          prop: 'params',
          type: 'Object',
          children: [
            {
              prop: 'id',
              isModel: false,
              type: 'Number',
              required: true,
              description: '主键'
            },
            {
              prop: 'name',
              isModel: false,
              type: 'String',
              required: true,
              description: '姓名'
            },
            {
              prop: 'status',
              isModel: false,
              type: 'Enum',
              options: '[{"value":"1","label":"已转正"},{"value":"0","label":"未转正"}]',
              required: true,
              description: '状态'
            },
            {
              prop: 'test',
              type: 'String',
              required: false,
              description: ''
            }
          ]
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
          type: 'String'
        },
        {
          prop: 'id',
          type: 'Number'
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
  description: ''
}

export default class ModelService {
  constructor() {
    this.db = new DateStore({
      filename: getDatabasePath('model.db'),
      autoload: true
    })

    this.db.ensureIndex({
      fieldName: '_id',
      unique: true
    })
    this.modelList = []
  }

  async create(params) {
    let mockId = this.modelList.length > 0 ? Math.max(...this.modelList.map((item) => item.id)) + 1 : 3
    const newModel = {
      ...defaultModel,
      id: mockId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...params
    }

    this.db.insert(newModel)
    this.modelList.push(newModel)

    return getResponseData({ records: this.modelList })
  }

  async delete(id) {
    const result = await this.db.findOneAsync({ id: Number(id) })
    await this.db.removeAsync({ id: Number(id) })

    return getResponseData(result)
  }

  async list() {
    this.modelList = await this.db.findAsync()

    return getResponseData({ records: this.modelList })
  }

  async update(id, params) {
    await this.db.updateAsync({ id: Number(id) }, { $set: params })
    const result = await this.db.findOneAsync({ id: Number(id) })

    return getResponseData(result)
  }
}
