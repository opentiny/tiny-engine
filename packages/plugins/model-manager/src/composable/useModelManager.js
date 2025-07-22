import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import axios from 'axios'
// 示例API路径，请根据实际后端接口调整
const modelApi = '/api/model-manager/models'

export function getModelList(params = {}) {
    console.log('=======================',axios.get)
  return axios.get('http://10.234.151.79:9090/material-center/api/model/list', { params })
}

export function createModel(data) {
  return getMetaApi(META_SERVICE.Http).post('http://10.234.151.79:9090/material-center/api/model/list', data)
}

export function updateModel(id, data) {
  return getMetaApi(META_SERVICE.Http).put(`${modelApi}/${id}`, data)
}

export function deleteModel(id) {
  return getMetaApi(META_SERVICE.Http).delete(`${modelApi}/${id}`)
} 