import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useMessage from '../src/useMessage'

describe('useMessage', () => {
  // 创建对subscribers全局对象的引用
  let subscriptions: string[] = []

  beforeEach(() => {
    subscriptions = []
  })

  afterEach(() => {
    // 清空所有订阅
    const { unsubscribe } = useMessage()

    // 为每个已订阅的主题调用unsubscribe
    subscriptions.forEach((topic) => {
      unsubscribe({ topic })
    })
  })

  // 创建一个辅助函数来跟踪订阅
  const trackSubscription = (topic: string) => {
    if (!subscriptions.includes(topic)) {
      subscriptions.push(topic)
    }
  }

  describe('subscribe 和 publish', () => {
    it('应该能够订阅和接收消息', () => {
      const { subscribe, publish } = useMessage()
      const callback = vi.fn()

      // 订阅消息
      subscribe({ topic: 'test-topic', callback })
      trackSubscription('test-topic')

      // 发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 验证回调被调用
      expect(callback).toHaveBeenCalledWith('test-data')
    })

    it('应该能够为同一主题注册多个回调', () => {
      const { subscribe, publish } = useMessage()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // 订阅同一主题的不同回调
      subscribe({ topic: 'test-topic', callback: callback1 })
      subscribe({ topic: 'test-topic', callback: callback2 })
      trackSubscription('test-topic')

      // 发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 验证所有回调都被调用
      expect(callback1).toHaveBeenCalledWith('test-data')
      expect(callback2).toHaveBeenCalledWith('test-data')
    })

    it('应该支持通过subscriber分组订阅', () => {
      const { subscribe, publish } = useMessage()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // 不同订阅者组的相同主题
      subscribe({ topic: 'test-topic', subscriber: 'group1', callback: callback1 })
      subscribe({ topic: 'test-topic', subscriber: 'group2', callback: callback2 })
      trackSubscription('test-topic')

      // 发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 验证所有回调都被调用
      expect(callback1).toHaveBeenCalledWith('test-data')
      expect(callback2).toHaveBeenCalledWith('test-data')
    })

    it('应该自动存储最后一条消息并在新订阅时发送', () => {
      const { subscribe, publish } = useMessage()

      // 先发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 后订阅，应该收到上一条消息
      const callback = vi.fn()
      subscribe({ topic: 'test-topic', callback })
      trackSubscription('test-topic')

      // 验证回调被调用
      expect(callback).toHaveBeenCalledWith('test-data')
    })
  })

  describe('unsubscribe', () => {
    it('应该能够取消特定订阅', () => {
      const { subscribe, unsubscribe, publish } = useMessage()
      const callback = vi.fn()

      // 先订阅
      const subscription = subscribe({ topic: 'test-topic', callback })
      trackSubscription('test-topic')

      // 取消订阅
      unsubscribe(subscription)

      // 发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 验证回调没有被调用
      expect(callback).not.toHaveBeenCalled()
    })

    it('应该能够通过topic参数取消订阅', () => {
      const { subscribe, unsubscribe, publish } = useMessage()
      const callback = vi.fn()

      // 先订阅
      subscribe({ topic: 'test-topic', callback })
      trackSubscription('test-topic')

      // 通过topic取消订阅
      unsubscribe({ topic: 'test-topic' })

      // 发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 验证回调没有被调用
      expect(callback).not.toHaveBeenCalled()
    })

    it('应该能够取消特定订阅者组的订阅', () => {
      const { subscribe, unsubscribe, publish } = useMessage()
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      // 不同订阅者组的相同主题
      subscribe({ topic: 'test-topic', subscriber: 'group1', callback: callback1 })
      subscribe({ topic: 'test-topic', subscriber: 'group2', callback: callback2 })
      trackSubscription('test-topic')

      // 只取消group1的订阅
      unsubscribe({ topic: 'test-topic', subscriber: 'group1' })

      // 发布消息
      publish({ topic: 'test-topic', data: 'test-data' })

      // 验证只有group2的回调被调用
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith('test-data')
    })
  })

  describe('broadcast', () => {
    it('应该能够广播消息到所有订阅者', () => {
      const { subscribe, broadcast } = useMessage()
      const callback = vi.fn()

      // 订阅消息
      subscribe({ topic: 'test-topic', callback })
      trackSubscription('test-topic')

      // 广播消息
      broadcast({ topic: 'test-topic', data: 'test-data' })

      // 验证回调被调用
      expect(callback).toHaveBeenCalledWith('test-data')
    })

    it('应该存储最后一条广播消息并在新实例化时自动发送', () => {
      // 第一个实例广播消息
      const { broadcast } = useMessage()
      broadcast({ topic: 'test-topic', data: 'test-data' })

      // 第二个实例的订阅者应该自动收到消息
      const message2 = useMessage()
      const callback = vi.fn()
      message2.subscribe({ topic: 'test-topic', callback })
      trackSubscription('test-topic')

      // 验证回调被调用
      expect(callback).toHaveBeenCalledWith('test-data')
    })
  })

  describe('参数验证', () => {
    it('应该安全处理无效的订阅参数', () => {
      const { subscribe } = useMessage()

      // 没有参数
      expect(() => subscribe()).not.toThrow()

      // 缺少回调
      expect(() => subscribe({ topic: 'test-topic' })).not.toThrow()

      // 无效的主题类型
      expect(() => subscribe({ topic: 123, callback: () => {} })).not.toThrow()
    })

    it('应该安全处理无效的发布参数', () => {
      const { publish } = useMessage()

      // 没有参数
      expect(() => publish()).not.toThrow()

      // 无效的主题类型
      expect(() => publish({ topic: 123, data: 'test' })).not.toThrow()
    })
  })
})
