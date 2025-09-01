import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export const getModelList = (currentPage, params) =>
  getMetaApi(META_SERVICE.Http).get(`/material-center/api/model/list?currentPage=${currentPage}&pageSize=10`, {
    params: params || {}
  })
