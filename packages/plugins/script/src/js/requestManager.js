/**
 * 请求管理器 - 支持防抖和请求取消
 */
class RequestManager {
  constructor() {
    this.abortController = null
    this.endpoint = ''
    this.debounceTimer = null
    this.debounceDelay = 200 // 防抖延迟（毫秒）
    this.lastTriggerTime = 0
    this.isDebounceEnabled = true
  }

  /**
   * 设置 API 端点
   */
  setEndpoint(endpoint) {
    this.endpoint = endpoint
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
   * 创建新的请求信号
   * 如果有正在进行的请求，会先取消它
   */
  createSignal() {
    // 取消之前的请求
    if (this.abortController) {
      this.abortController.abort()
    }

    // 创建新的 AbortController
    this.abortController = new AbortController()
    return this.abortController.signal
  }

  /**
   * 清理当前的 AbortController
   */
  clear() {
    this.abortController = null
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
   * 支持请求取消和智能防抖
   */
  createRequestHandler() {
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

      // 执行实际的请求
      return this.executeRequest(params)
    }
  }

  /**
   * 执行实际的 HTTP 请求
   */
  async executeRequest(params) {
    const signal = this.createSignal()

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params.body),
        signal // 添加取消信号
      })

      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`
        this.clear()
        return {
          completion: null,
          error: errorMsg
        }
      }

      const data = await response.json()
      this.clear() // 请求成功，清理 controller

      return {
        completion: data.completion || null,
        error: data.error
      }
    } catch (error) {
      // 如果是取消错误
      if (error.name === 'AbortError') {
        return {
          completion: null,
          error: 'Request cancelled'
        }
      }

      this.clear()
      return {
        completion: null,
        error: error.message
      }
    }
  }

  /**
   * 重置状态（用于清理）
   */
  reset() {
    this.clearDebounceTimer()
    if (this.abortController) {
      this.abortController.abort()
      this.clear()
    }
  }
}

export const requestManager = new RequestManager()
