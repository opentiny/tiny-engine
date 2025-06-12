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

/* metaService: engine.service.dataSource.useDataSource */
import { reactive } from 'vue'
import { utils } from '@opentiny/tiny-engine-utils'
import { isEqual } from '@opentiny/vue-renderless/common/object'
import { isEmptyObject } from '@opentiny/vue-renderless/common/type'
import { useModal } from '@opentiny/tiny-engine-meta-register'

const dataSourceState = reactive({
  dataSource: {},
  record: {},
  recordCopies: {},
  dataSourceColumn: {},
  dataSourceColumnCopies: {},
  remoteData: {},
  remoteDataCopies: {},
  currentRecordId: '',
  isRecordValidate: true,
  disCard: false,
  remoteConfig: {}
})

const compareData = () => {
  let isRecordSame = true
  let isDataSourceSame = false

  if (!isEmptyObject(dataSourceState.record) && !isEmptyObject(dataSourceState.recordCopies)) {
    isRecordSame = isEqual(dataSourceState.record, dataSourceState.recordCopies)
  }

  isDataSourceSame = isEqual(dataSourceState.dataSourceColumn, dataSourceState.dataSourceColumnCopies)

  const isRemoteDataSame = isEqual(dataSourceState.remoteData, dataSourceState.remoteDataCopies)

  return { isRecordSame, isDataSourceSame, isRemoteDataSame }
}

interface DataSourceState {
  dataSource: Record<string, any>
  record: Record<string, any>
  recordCopies: Record<string, any>
  dataSourceColumn: Record<string, any>
  dataSourceColumnCopies: Record<string, any>
  remoteData: Record<string, any>
  remoteDataCopies: Record<string, any>
  currentRecordId: string
  isRecordValidate: boolean
  disCard: boolean
  remoteConfig: Record<string, any>
}

const handleConfirmSave = (
  dataSourceState: DataSourceState,
  isRecordSame: boolean,
  resolve: (value: unknown) => void,
  isDataSourceSame: boolean,
  callback: (...args: any[]) => any
) => {
  let {
    name,
    data: { data, columns }
  } = dataSourceState.dataSource

  if (!isRecordSame) {
    // 必填字段没数据不记录该条数据
    if (!dataSourceState.isRecordValidate) {
      dataSourceState.record = {}
      dataSourceState.recordCopies = {}
      dataSourceState.isRecordValidate = true
      return resolve(true)
    }

    // 数据源数据修改，新增，数据源数据做修改
    if (dataSourceState.currentRecordId) {
      data = data || []
      const index = data.findIndex((item: { id: string }) => item.id === dataSourceState.currentRecordId)

      data[index] = Object.assign(data[index], dataSourceState.record)
    } else {
      const record = { ...dataSourceState.record, id: utils.guid() }
      data = [...data, record]
    }
  }

  if (!isDataSourceSame) {
    // 数据源名称，类型，字段改变，数据源修改
    columns = dataSourceState.dataSourceColumn?.columns
    name = dataSourceState.dataSourceColumn?.name
  }

  const {
    id,
    data: { type }
  } = dataSourceState.dataSource

  const requestData = { name, data: { columns, data, type } }

  callback(id, requestData).then((data: any) => {
    if (data) {
      dataSourceState.record = {}
      dataSourceState.recordCopies = {}
      dataSourceState.currentRecordId = ''
      dataSourceState.dataSourceColumn = {}
      dataSourceState.dataSourceColumnCopies = {}
      dataSourceState.dataSource = {}
      resolve(true)
    }
  })

  return undefined
}

const saveDataSource = (callback: (...args: any[]) => any) => {
  const { isRecordSame, isDataSourceSame } = compareData()
  const { confirm } = useModal()

  if (!isEmptyObject(dataSourceState.dataSource) && (!isRecordSame || !isDataSourceSame)) {
    return new Promise((resolve) => {
      confirm({
        title: '提示',
        message: dataSourceState.isRecordValidate
          ? '当前数据未保存，关闭前是否需要保存改数据'
          : '必填项为空，将不会被存储！',
        exec: () => handleConfirmSave(dataSourceState, isDataSourceSame, resolve, isDataSourceSame, callback)
      })
    })
  }

  return Promise.resolve(false)
}

export default () => {
  return { dataSourceState, compareData, saveDataSource }
}
