/**
 * 低代码数据源配置
 * 用于处理低代码平台的数据源
 */

// 数据源类型枚举
export const DataSourceType = {
  API: 'api',
  STATIC: 'static',
  STORAGE: 'storage'
}

// 数据源处理器映射
const dataSourceHandlers = {
  // API数据源处理器
  [DataSourceType.API]: async (config) => {
    const { url, method = 'GET', headers = {}, params = {}, data = {} } = config
    
    try {
      // 在UniApp中使用uni.request发起请求
      return await new Promise((resolve, reject) => {
        uni.request({
          url,
          method,
          header: headers,
          data: method.toUpperCase() === 'GET' ? params : data,
          success: (res) => {
            resolve(res.data)
          },
          fail: (err) => {
            reject(err)
          }
        })
      })
    } catch (error) {
      console.error('API数据源请求失败:', error)
      throw error
    }
  },
  
  // 静态数据源处理器
  [DataSourceType.STATIC]: (config) => {
    return Promise.resolve(config.data || {})
  },
  
  // 存储数据源处理器
  [DataSourceType.STORAGE]: async (config) => {
    const { key, defaultValue } = config
    
    try {
      return await new Promise((resolve) => {
        uni.getStorage({
          key,
          success: (res) => {
            resolve(res.data)
          },
          fail: () => {
            resolve(defaultValue)
          }
        })
      })
    } catch (error) {
      console.error('存储数据源获取失败:', error)
      return defaultValue
    }
  }
}

// 数据源管理器
export class DataSourceManager {
  constructor() {
    this.dataSources = {}
    this.dataCache = {}
  }
  
  // 注册数据源
  registerDataSource(id, config) {
    this.dataSources[id] = config
    return this
  }
  
  // 批量注册数据源
  registerDataSources(dataSources) {
    Object.entries(dataSources).forEach(([id, config]) => {
      this.registerDataSource(id, config)
    })
    return this
  }
  
  // 获取数据源数据
  async getDataSourceData(id, params = {}) {
    const config = this.dataSources[id]
    
    if (!config) {
      console.error(`数据源 "${id}" 不存在`)
      return null
    }
    
    try {
      // 合并参数
      const mergedConfig = {
        ...config,
        params: { ...(config.params || {}), ...params }
      }
      
      // 获取处理器
      const handler = dataSourceHandlers[config.type]
      
      if (!handler) {
        console.error(`不支持的数据源类型: ${config.type}`)
        return null
      }
      
      // 处理数据源
      const data = await handler(mergedConfig)
      
      // 缓存数据
      this.dataCache[id] = data
      
      return data
    } catch (error) {
      console.error(`获取数据源 "${id}" 数据失败:`, error)
      return null
    }
  }
  
  // 获取缓存的数据
  getCachedData(id) {
    return this.dataCache[id]
  }
  
  // 清除缓存
  clearCache(id) {
    if (id) {
      delete this.dataCache[id]
    } else {
      this.dataCache = {}
    }
    return this
  }
}

// 创建默认数据源管理器实例
export const dataSourceManager = new DataSourceManager()

// 初始化数据源
export function initDataSources(dataSources = {}) {
  dataSourceManager.registerDataSources(dataSources)
  return dataSourceManager
}