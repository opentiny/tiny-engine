import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
// 统一的模型后端接口前缀（相对路径，便于代理）
const modelApiBase = '/material-center/api/model'

export function _getModelLists(params = {}) {
  return getMetaApi(META_SERVICE.Http).get(`${modelApiBase}/list`, { params })
}

export function createModel(data) {
  return getMetaApi(META_SERVICE.Http).post(`${modelApiBase}/save`, data)
}

export function updateModel(data) {
  return getMetaApi(META_SERVICE.Http).put(`${modelApiBase}/update`, data)
}

export function deleteModel(id) {
  return getMetaApi(META_SERVICE.Http).delete(`${modelApiBase}/delete/${id}`)
}
