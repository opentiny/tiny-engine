import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useDataSource from './useDataSource'

export const DataSourceService = {
  id: 'engine.service.dataSource',
  type: 'MetaService',
  apis: useDataSource(),
  composable: {
    name: HOOK_NAME.useDataSource
  }
}
