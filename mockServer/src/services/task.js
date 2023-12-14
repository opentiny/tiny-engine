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

import path from 'path'
import DateStore from '@seald-io/nedb'
import { getResponseData } from '../tool/Common'
import { E_TASK_STATUS } from '../tool/constants'
export default class TaskService {
  constructor() {
    this.db = new DateStore({
      filename: path.resolve(__dirname, '../database/task.db'),
      autoload: true
    })

    this.taskModel = {
      id: '',
      teamId: 0,
      taskTypeId: null,
      uniqueId: null,
      taskName: '',
      taskStatus: null,
      taskResult: null,
      progress: ''
    }
  }

  async create(params) {
    const taskData = { ...this.taskModel, ...params }
    const result = await this.db.insertAsync(taskData)
    const { _id } = result
    await this.db.updateAsync({ _id }, { $set: { id: _id } })
    result.id = result._id
    return getResponseData(result)
  }

  async update(params) {
    const { id } = params
    await this.db.updateAsync({ _id: id }, { $set: params })
    const result = await this.db.findOneAsync({ _id: id })
    return getResponseData(result)
  }

  async find(params) {
    const { id } = params
    const blockGroup = await this.db.findOneAsync({ _id: id })
    return getResponseData([blockGroup])
  }

  async getUnfinishedTask(type, id) {
    const res = await this.db.findAsync({ taskTypeId: type, uniqueId: id })
    res.filter((data) => [E_TASK_STATUS.INIT, E_TASK_STATUS.RUNNING].includes(data.taskStatus))
    if (res.length) {
      return getResponseData(res[0])
    }
    return null
  }
}
