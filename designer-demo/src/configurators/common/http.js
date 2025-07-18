import { HttpService } from '@opentiny/tiny-engine'

export const getModelList = (params) => HttpService.apis.get('http://10.234.151.79:9090/model/list', params)
