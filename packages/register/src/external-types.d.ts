/**
 * 临时类型声明文件
 *
 * 此文件为暂未导出类型声明的内部包提供临时类型定义
 * TODO: 当这些包完成类型导出后，应当删除此文件
 *
 * 相关包列表：
 * - @opentiny/tiny-engine-canvas
 * - @opentiny/tiny-engine-layout
 * - @opentiny/tiny-engine-plugin-* (block, datasource, help, i18n, materials, page, robot)
 * - @opentiny/tiny-engine-setting-props
 * - @opentiny/tiny-engine-toolbar-* (breadcrumb, generate-code, redoundo)
 * - @opentiny/tiny-engine-common
 */

// Canvas API - 导出一个返回 API 对象的函数
declare module '@opentiny/tiny-engine-canvas/DesignCanvas/src/api' {
  const useCanvasApi: () => Record<string, any>
  export default useCanvasApi
}

// Layout Service - 导出包含 apis 属性的服务对象
declare module '@opentiny/tiny-engine-layout' {
  export const LayoutService: {
    apis: Record<string, any>
  }
}

// Plugin: Block - 区块管理服务
declare module '@opentiny/tiny-engine-plugin-block' {
  export const BlockService: {
    apis: Record<string, any>
  }
}

// Plugin: DataSource - 数据源管理服务
declare module '@opentiny/tiny-engine-plugin-datasource' {
  export const DataSourceService: {
    apis: Record<string, any>
  }
}

// Plugin: Help - 帮助服务
declare module '@opentiny/tiny-engine-plugin-help' {
  export const HelpService: {
    apis: Record<string, any>
  }
}

// Plugin: I18n - 国际化翻译服务
declare module '@opentiny/tiny-engine-plugin-i18n' {
  export const TranslateService: {
    apis: Record<string, any>
  }
}

// Plugin: Materials - 物料管理服务（包含两个服务）
declare module '@opentiny/tiny-engine-plugin-materials' {
  export const MaterialService: {
    apis: Record<string, any>
  }
  export const ResourceService: {
    apis: Record<string, any>
  }
}

// Plugin: Page - 页面管理服务
declare module '@opentiny/tiny-engine-plugin-page' {
  export const PageService: {
    apis: Record<string, any>
  }
}

// Plugin: Robot - AI 机器人服务
declare module '@opentiny/tiny-engine-plugin-robot' {
  export const RobotService: {
    apis: Record<string, any>
  }
}

// Setting: Props - 属性配置服务（包含两个服务）
declare module '@opentiny/tiny-engine-setting-props' {
  export const PropertiesService: {
    apis: Record<string, any>
  }
  export const PropertyService: {
    apis: Record<string, any>
  }
}

// Toolbar: Breadcrumb - 面包屑导航服务
declare module '@opentiny/tiny-engine-toolbar-breadcrumb' {
  export const BreadcrumbService: {
    apis: Record<string, any>
  }
}

// Toolbar: Generate Code - 代码生成和本地保存服务
declare module '@opentiny/tiny-engine-toolbar-generate-code' {
  export const SaveLocalService: {
    apis: Record<string, any>
  }
}

// Toolbar: Redo/Undo - 历史记录服务
declare module '@opentiny/tiny-engine-toolbar-redoundo' {
  export const HistoryService: {
    apis: Record<string, any>
  }
}

// Common - 通用工具（Modal 和 Notify）
declare module '@opentiny/tiny-engine-common' {
  export const Modal: Record<string, any>
  export const Notify: (...args: any[]) => any
}
