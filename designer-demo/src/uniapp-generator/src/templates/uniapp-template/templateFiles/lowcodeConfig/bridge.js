/**
 * 低代码桥接文件
 * 用于连接低代码平台和运行时
 */

// 全局事件总线
class EventBus {
  constructor() {
    this.events = {}
  }

  // 订阅事件
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = []
    }
    this.events[eventName].push(callback)
    return () => this.off(eventName, callback)
  }

  // 取消订阅
  off(eventName, callback) {
    if (!this.events[eventName]) return
    if (!callback) {
      delete this.events[eventName]
    } else {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback)
    }
  }

  // 触发事件
  emit(eventName, ...args) {
    if (!this.events[eventName]) return
    this.events[eventName].forEach(callback => {
      callback(...args)
    })
  }

  // 只订阅一次
  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args)
      this.off(eventName, wrapper)
    }
    this.on(eventName, wrapper)
    return () => this.off(eventName, wrapper)
  }
}

// 创建全局事件总线实例
export const eventBus = new EventBus()

// 低代码桥接对象
export const bridge = {
  // 调用低代码平台方法
  callHostMethod(methodName, ...args) {
    console.log(`调用低代码平台方法: ${methodName}`, args)
    // 在实际环境中，这里会调用宿主环境提供的方法
    return Promise.resolve(null)
  },

  // 注册运行时方法，供低代码平台调用
  registerRuntimeMethod(methodName, callback) {
    eventBus.on(`runtime:${methodName}`, callback)
    return () => eventBus.off(`runtime:${methodName}`, callback)
  },

  // 触发运行时事件
  emitRuntimeEvent(eventName, ...args) {
    eventBus.emit(`runtime:${eventName}`, ...args)
    return true
  },

  // 监听低代码平台事件
  onHostEvent(eventName, callback) {
    return eventBus.on(`host:${eventName}`, callback)
  }
}

// 初始化桥接
export function initBridge() {
  // 这里可以进行一些初始化操作
  console.log('低代码桥接初始化完成')
  
  // 模拟低代码平台就绪事件
  setTimeout(() => {
    eventBus.emit('host:ready', { version: '1.0.0' })
  }, 100)
  
  return bridge
}