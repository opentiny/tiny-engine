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

export type ReturnTypeOfUseCanvas = ReturnType<typeof useCanvasApi>
export type ReturnTypeOfUseLayout = typeof LayoutService['apis']

// plugin
export type ReturnTypeOfUseBlock = typeof BlockService['apis']
export type ReturnTypeOfUseDataSource = typeof DataSourceService['apis']
export type ReturnTypeOfUseHelp = typeof HelpService['apis']
export type ReturnTypeOfUseTranslate = typeof TranslateService['apis']
export type ReturnTypeOfUseMaterial = typeof MaterialService['apis']
export type ReturnTypeOfUseResource = typeof ResourceService['apis']
export type ReturnTypeOfUsePage = typeof PageService['apis']

// setting
export type ReturnTypeOfUseProperties = typeof PropertiesService['apis']
export type ReturnTypeOfUseProperty = typeof PropertyService['apis']

// toolbar
export type ReturnTypeOfUseBreadcrumb = typeof BreadcrumbService['apis']
export type ReturnTypeOfUseSaveLocal = typeof SaveLocalService['apis']
export type ReturnTypeOfUseHistory = typeof HistoryService['apis']

export type ReturnTypeOfUseModal = typeof Modal
export type ParametersOfUseNotify = Parameters<typeof Notify>
export type ReturnTypeOfUseNotify = ReturnType<typeof Notify>
