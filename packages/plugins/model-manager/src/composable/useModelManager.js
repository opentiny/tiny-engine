import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

// 示例API路径，请根据实际后端接口调整
const modelApi = '/material-center/api/model'

export function getModelList(params = {}) {
  return getMetaApi(META_SERVICE.Http).get(`${modelApi}/list`, { params })
}

export function createModel(data) {
  return getMetaApi(META_SERVICE.Http).post(`${modelApi}/create`, data)
}

export function updateModel(id, data) {
  return getMetaApi(META_SERVICE.Http).put(`${modelApi}/update/${id}`, data)
}

export function deleteModel(id) {
  return getMetaApi(META_SERVICE.Http).delete(`${modelApi}/delete/${id}`)
}

export function getModelSql() {
  return getMetaApi(META_SERVICE.Http).get(`${modelApi}/table/list`)
}

export function getModelSqlById(id) {
  return getMetaApi(META_SERVICE.Http).get(`${modelApi}/table/${id}`)
}
