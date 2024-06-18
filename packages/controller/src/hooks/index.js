import { HOOK_NAME } from '@opentiny/tiny-engine-entry'

import useApp from './useApp'
import useResource from './useResource'
import useHistory from './useHistory'
import useProperties from './useProperties'
import useSaveLocal from './useSaveLocal'
import useEditorInfo from './useEditorInfo'
import useBlock from './useBlock'
import useTranslate from './useTranslate'
import usePage from './usePage'
import useDataSource from './useDataSource'
import useBreadcrumb from './useBreadcrumb'
import useProperty from './useProperty'
import useHelp from './useHelp'

export const AppService = {
  id: 'engine.service.app',
  type: 'MetaService',
  apis: useApp(),
  composable: {
    name: HOOK_NAME.useApp
  }
}

export const ResourceService = {
  id: 'engine.service.resource',
  type: 'MetaService',
  apis: useResource(),
  composable: {
    name: HOOK_NAME.useResource
  }
}

export const HistoryService = {
  id: 'engine.service.history',
  type: 'MetaService',
  apis: useHistory(),
  composable: {
    name: HOOK_NAME.useHistory
  }
}

export const PropertiesService = {
  id: 'engine.service.properties',
  type: 'MetaService',
  apis: useProperties(),
  composable: {
    name: HOOK_NAME.useProperties
  }
}

export const SaveLocalService = {
  id: 'engine.service.saveLocal',
  type: 'MetaService',
  apis: useSaveLocal(),
  composable: {
    name: HOOK_NAME.useSaveLocal
  }
}

export const EditorInfoService = {
  id: 'engine.service.editorInfo',
  type: 'MetaService',
  apis: useEditorInfo(),
  composable: {
    name: HOOK_NAME.useEditorInfo
  }
}

export const BlockService = {
  id: 'engine.service.block',
  type: 'MetaService',
  apis: useBlock(),
  composable: {
    name: HOOK_NAME.useBlock
  }
}

export const TranslateService = {
  id: 'engine.service.translate',
  type: 'MetaService',
  apis: useTranslate(),
  composable: {
    name: HOOK_NAME.useTranslate
  }
}

export const PageService = {
  id: 'engine.service.page',
  type: 'MetaService',
  apis: usePage(),
  composable: {
    name: HOOK_NAME.usePage
  }
}

export const DataSourceService = {
  id: 'engine.service.dataSource',
  type: 'MetaService',
  apis: useDataSource(),
  composable: {
    name: HOOK_NAME.useDataSource
  }
}

export const BreadcrumbService = {
  id: 'engine.service.breadcrumb',
  type: 'MetaService',
  apis: useBreadcrumb(),
  composable: {
    name: HOOK_NAME.useBreadcrumb
  }
}

export const PropertyService = {
  id: 'engine.service.property',
  type: 'MetaService',
  apis: useProperty(),
  composable: {
    name: HOOK_NAME.useProperty
  }
}

export const HelpService = {
  id: 'engine.service.help',
  type: 'MetaService',
  apis: useHelp(),
  composable: {
    name: HOOK_NAME.useHelp
  }
}
