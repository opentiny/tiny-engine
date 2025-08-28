import { HttpService } from '@opentiny/tiny-engine'

export const getModelList = (currentPage, params) => HttpService.apis.get(`http://10.234.151.79:9090/material-center/api/model/list?currentPage=${currentPage}&pageSize=10`, { params: params || {} })
