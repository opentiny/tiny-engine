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

let lastMessage = null
const subscribers = { '': {} }

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
const subscribe = ({ topic, subscriber, callback } = {}) => {
  const root = subscribers['']
  let listeners = root

  if (topic && typeof topic === 'string' && typeof callback === 'function') {
    if (subscriber && typeof subscriber === 'string') {
      listeners = subscribers[subscriber] || {}
      subscribers[subscriber] = listeners
    }

    const callbacks = listeners[topic] || []
    listeners[topic] = callbacks
    callbacks.push(callback)

    const lastEvent = callbacks.lastEvent || root[topic]?.lastEvent
    if (lastEvent) {
      callback(lastEvent.data)
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
const unsubscribe = ({ topic, subscriber } = {}) => {
  if (topic && typeof topic === 'string') {
    const removeListener = (subscriber) => {
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
const publish = ({ topic, data } = {}) => {
  if (!topic || typeof topic !== 'string') {
    return
  }

  for (const value of Object.values(subscribers)) {
    let callbacks = value[topic] || []

    if (callbacks.length) {
      for (const cb of callbacks) {
        cb(data)
      }
    } else {
      value[topic] = callbacks
    }

    callbacks.lastEvent = { data }
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
const broadcast = ({ topic, data }) => {
  if (topic && typeof topic === 'string') {
    lastMessage = { topic, data }

    publish(lastMessage)
  }
}

export default () => {
  // 新use的message自动广播上次的异步消息
  lastMessage && publish(lastMessage)

  return {
    subscribe,
    unsubscribe,
    publish,
    broadcast
  }
}
