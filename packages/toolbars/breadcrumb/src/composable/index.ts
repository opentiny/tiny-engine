import { HOOK_NAME } from '@opentiny/tiny-engine-meta-register'
import useBreadcrumb from './useBreadcrumb'

export const BreadcrumbService = {
  id: 'engine.service.breadcrumb',
  type: 'MetaService',
  apis: useBreadcrumb(),
  composable: {
    name: HOOK_NAME.useBreadcrumb
  }
}
