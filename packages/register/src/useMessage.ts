/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

// 消息事件类型，用于存储消息数据
interface MessageEvent<T = unknown> {
  data: T
}

// 消息回调函数类型
type MessageCallback<T = unknown> = (data: T) => void

// 带有 lastEvent 属性的回调数组类型
interface CallbacksWithLastEvent<T = unknown> extends Array<MessageCallback<T>> {
  lastEvent?: MessageEvent<T>
}

// 监听器映射类型：topic -> callbacks
type ListenersMap = Record<string, CallbacksWithLastEvent>

// 订阅者映射类型：subscriber -> listeners
type SubscribersMap = Record<string, ListenersMap>

// subscribe 函数参数接口
interface SubscribeOptions<T = unknown> {
  topic?: string
  subscriber?: string
  callback?: MessageCallback<T>
}

// unsubscribe 函数参数接口
interface UnsubscribeOptions {
  topic?: string
  subscriber?: string
}

// publish 函数参数接口
interface PublishOptions<T = unknown> {
  topic?: string
  data?: T
}

// broadcast 函数参数接口（topic 和 data 为必需参数）
interface BroadcastOptions<T = unknown> {
  topic: string
  data: T
}

// 订阅消息返回的描述符
interface MessageDescriptor {
  topic: string | undefined
  subscriber: string | undefined
}

// useMessage 钩子的返回值类型
interface UseMessageReturn {
  subscribe: <T = unknown>(options?: SubscribeOptions<T>) => MessageDescriptor
  unsubscribe: (options?: UnsubscribeOptions) => void
  publish: <T = unknown>(options?: PublishOptions<T>) => void
  broadcast: <T = unknown>(options: BroadcastOptions<T>) => void
}

let lastMessage: PublishOptions | null = null
const subscribers: SubscribersMap = { '': {} }

/**
 * 订阅消息。
 *
 *      const { subscribe } = useMessage()
 *      subscribe({ topic: 'myTopic', callback: data => console.log(data) })
 *
 * @member TinyEditor.message
 * @param {Object} object { topic: 消息名称, subscriber(可选): 消息集合, callback: 接收到消息之后的回调用函数 }
 * @return {Object} { topic: 消息名称, subscriber: 消息集合 }
 */
const subscribe = <T = unknown>({ topic, subscriber, callback }: SubscribeOptions<T> = {}): MessageDescriptor => {
  const root: ListenersMap = subscribers['']
  let listeners: ListenersMap = root

  if (topic && typeof topic === 'string' && typeof callback === 'function') {
    if (subscriber && typeof subscriber === 'string') {
      listeners = subscribers[subscriber] || {}
      subscribers[subscriber] = listeners
    }

    const callbacks: CallbacksWithLastEvent<T> = (listeners[topic] as CallbacksWithLastEvent<T>) || []
    listeners[topic] = callbacks
    callbacks.push(callback)

    const lastEvent = callbacks.lastEvent || root[topic]?.lastEvent
    if (lastEvent) {
      callback(lastEvent.data as T)
    }
  }

  return { topic, subscriber }
}

/**
 * 取消订阅。
 *
 *      //订阅消息
 *      const { subscribe } = useMessage()
 *      let message = subscribe({ topic: 'myTopic', callback: data => console.log(data) })
 *
 *      //取消订阅
 *      const { unsubscribe } = useMessage()
 *      unsubscribe({topic: 'myTopic'}) // 方式一
 *      unsubscribe(message) // 方式二
 *
 * @member TinyEditor.message
 * @param {Object} object { topic: 消息名称, subscriber(可选): 消息集合 }
 */
const unsubscribe = ({ topic, subscriber }: UnsubscribeOptions = {}): void => {
  if (topic && typeof topic === 'string') {
    const removeListener = (subscriber: string): void => {
      const listeners = subscribers[subscriber]
      if (listeners) {
        delete listeners[topic]
        if (subscriber && !Object.getOwnPropertyNames(listeners).length) {
          delete subscribers[subscriber]
        }
      }
    }

    if (subscriber && typeof subscriber === 'string') {
      removeListener(subscriber)

      return
    }

    for (const key of Object.keys(subscribers)) {
      removeListener(key)
    }
  }
}

/**
 * 发布消息。
 *      const { publish } = useMessage()
 *      publish({ topic: 'myTopic', data: 'string' })
 *      publish({ topic: 'myTopic', data: {} })
 *
 * @member TinyEditor.message
 * @param {Object} object { topic: 消息名称, data(string | object): 消息内容 }
 */
const publish = <T = unknown>({ topic, data }: PublishOptions<T> = {}): void => {
  if (!topic || typeof topic !== 'string') {
    return
  }

  for (const value of Object.values(subscribers)) {
    const callbacks: CallbacksWithLastEvent<T> = (value[topic] as CallbacksWithLastEvent<T>) || []

    if (callbacks.length) {
      for (const cb of callbacks) {
        cb(data as T)
      }
    } else {
      value[topic] = callbacks
    }

    callbacks.lastEvent = { data: data as T }
  }
}

/**
 * 广播消息。
 *      const { broadcast } = useMessage()
 *      broadcast({ topic: 'myTopic', data: 'string' })
 *      broadcast({ topic: 'myTopic', data: {} })
 *
 * @member TinyEditor.message
 * @param {Object} object { topic: 消息名称, data(string | object): 消息内容 }
 */
const broadcast = <T = unknown>({ topic, data }: BroadcastOptions<T>): void => {
  if (topic && typeof topic === 'string') {
    lastMessage = { topic, data }

    publish(lastMessage)
  }
}

export default (): UseMessageReturn => {
  // 新use的message自动广播上次的异步消息
  if (lastMessage) {
    publish(lastMessage)
  }

  return {
    subscribe,
    unsubscribe,
    publish,
    broadcast
  }
}
