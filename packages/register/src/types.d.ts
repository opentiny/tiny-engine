import { default as useCanvasApi } from '@opentiny/tiny-engine-canvas/DesignCanvas/src/api'
import { LayoutService } from '@opentiny/tiny-engine-layout'
import { BlockService } from '@opentiny/tiny-engine-plugin-block'
import { DataSourceService } from '@opentiny/tiny-engine-plugin-datasource'
import { HelpService } from '@opentiny/tiny-engine-plugin-help'
import { TranslateService } from '@opentiny/tiny-engine-plugin-i18n'
import { MaterialService, ResourceService } from '@opentiny/tiny-engine-plugin-materials'
import { PageService } from '@opentiny/tiny-engine-plugin-page'
import { PropertiesService, PropertyService } from '@opentiny/tiny-engine-setting-props'
import { BreadcrumbService } from '@opentiny/tiny-engine-toolbar-breadcrumb'
import { SaveLocalService } from '@opentiny/tiny-engine-toolbar-generate-code'
import { HistoryService } from '@opentiny/tiny-engine-toolbar-redoundo'
import { Modal, Notify } from '@opentiny/tiny-engine-common'

export type UseCanvasApi = ReturnType<typeof useCanvasApi>
export type UseLayoutApi = typeof LayoutService['apis']

// plugin
export type UseBlockApi = typeof BlockService['apis']
export type UseDataSourceApi = typeof DataSourceService['apis']
export type UseHelpApi = typeof HelpService['apis']
export type UseTranslateApi = typeof TranslateService['apis']
export type UseMaterialApi = typeof MaterialService['apis']
export type UseResourceApi = typeof ResourceService['apis']
export type UsePageApi = typeof PageService['apis']

// setting
export type UsePropertiesApi = typeof PropertiesService['apis']
export type UsePropertyApi = typeof PropertyService['apis']

// toolbar
export type UseBreadcrumbApi = typeof BreadcrumbService['apis']
export type UseSaveLocalApi = typeof SaveLocalService['apis']
export type UseHistoryApi = typeof HistoryService['apis']

export type UseModalApi = typeof Modal
export type NotifyParams = Parameters<typeof Notify>
export type NotifyResult = ReturnType<typeof Notify>
