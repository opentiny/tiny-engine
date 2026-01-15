/**
 * 防抖管理器 - 仅支持防抖功能
 */
class DebounceManager {
  constructor() {
    this.debounceTimer = null
    this.debounceDelay = 200 // 防抖延迟（毫秒）
    this.lastTriggerTime = 0
    this.isDebounceEnabled = true
  }

  /**
   * 设置防抖延迟
   */
  setDebounceDelay(delay) {
    this.debounceDelay = delay
  }

  /**
   * 启用/禁用防抖
   */
  setDebounceEnabled(enabled) {
    this.isDebounceEnabled = enabled
  }

  /**
   * 清理防抖定时器
   */
  clearDebounceTimer() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  /**
   * 检查是否应该立即执行（不防抖）
   * 某些情况下应该立即响应，不需要防抖
   */
  shouldExecuteImmediately() {
    const now = Date.now()
    const timeSinceLastTrigger = now - this.lastTriggerTime

    // 如果距离上次触发超过 1 秒，立即执行
    // 这避免了用户停止输入后再次输入时的延迟
    return timeSinceLastTrigger > 1000
  }

  /**
   * 创建带防抖的请求处理器
   * @param {Function} handler - 实际的请求处理函数
   */
  createRequestHandler(handler) {
    return async (params) => {
      this.lastTriggerTime = Date.now()

      // 如果启用了防抖且不应该立即执行
      if (this.isDebounceEnabled && !this.shouldExecuteImmediately()) {
        // 清理之前的防抖定时器
        this.clearDebounceTimer()

        // 创建新的防抖 Promise
        await new Promise((resolve) => {
          this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null
            resolve()
          }, this.debounceDelay)
        })
      }

      // 执行实际的请求处理器
      if (handler) {
        return await handler(params)
      }

      return null
    }
  }

  /**
   * 重置状态（用于清理）
   */
  reset() {
    this.clearDebounceTimer()
  }
}

export const debounceManager = new DebounceManager()
