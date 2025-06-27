/**
 * 低代码配置主入口文件
 */
import { initBridge, bridge, eventBus } from './bridge'
import { initDataSources, dataSourceManager } from './dataSource'

// 低代码配置
const lowcodeConfig = {
  // 项目信息
  project: {
    name: '$$TinyEngine{projectName}END$',
    description: '$$TinyEngine{description}END$'
  },
  
  // 数据源配置
  dataSources: {
    // 示例数据源
    example: {
      type: 'static',
      data: {
        message: 'Hello from TinyEngine UniApp!'
      }
    }
  },
  
  // 页面配置
  pages: {}
}

// 低代码上下文
export const lowcodeContext = {
  bridge,
  eventBus,
  dataSourceManager,
  config: lowcodeConfig
}

// 设置低代码环境
export function setupLowcode(app) {
  // 初始化桥接
  initBridge()
  
  // 初始化数据源
  initDataSources(lowcodeConfig.dataSources)
  
  // 注册全局属性
  app.config.globalProperties.$lowcode = lowcodeContext
  
  // 注册全局方法
  app.config.globalProperties.$dataSource = (id, params) => {
    return dataSourceManager.getDataSourceData(id, params)
  }
  
  // 监听低代码平台就绪事件
  bridge.onHostEvent('ready', (data) => {
    console.log('低代码平台就绪:', data)
  })
  
  return lowcodeContext
}

// 导出低代码上下文
export default lowcodeContext