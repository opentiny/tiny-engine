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

import { requestEvent } from './http.js'

let monitorUrl = ''

/**
 * 全局js异常埋点上报
 * @param errorMessage 异常信息
 * @param scriptURI 异常文件路径
 * @param lineNo 异常行号
 * @param columnNo 异常列号
 * @param error 异常堆栈信息
 */
const getUrlUnit = () => {
  const urlUnit = window.location?.search?.substring(1)?.split('&')
  const unit = {}
  if (urlUnit.length) {
    urlUnit.forEach((item) => {
      let unitItem = item.split('=')
      unit[unitItem[0]] = unitItem[1]
    })
  }

  return JSON.stringify(unit)
}

const globalMonitoring = () => {
  window.onerror = function (errorMessage, scriptURI, lineNo, columnNo, error) {
    requestEvent(monitorUrl, {
      event_type: 'design_JSError',
      url: window.location.href,
      unit: getUrlUnit(),
      content: JSON.stringify({ errorMessage: errorMessage, scriptURI: scriptURI, columnNo: columnNo, error: error })
    })
  }
}

/**
 * promise异常埋点上报
 * @param message 异常promise原因
 * @param matchResult 异常promise堆栈
 */

const promiseMonitoring = () => {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      event.preventDefault()
      let message
      let matchResult = ''
      let reason = event.reason
      if (typeof reason === 'string') {
        message = reason
      } else if (typeof reason === 'object') {
        message = reason.message
        if (reason.stack) {
          matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/)
        }
      }

      requestEvent(monitorUrl, {
        event_type: 'design_promiseError',
        url: window.location.href,
        unit: getUrlUnit(),
        content: JSON.stringify({
          message: message,
          matchResult: matchResult
        })
      })
    },
    true
  )
}

/**
 * iframe加载完后异常报错埋点上报
 * @param errorMessage 异常信息
 * @param scriptURI 异常文件路径
 * @param lineNo 异常行号
 * @param columnNo 异常列号
 * @param error 异常堆栈信息
 */

export const iframeMonitoring = () => {
  if (!monitorUrl) {
    return false
  }

  window.frames[0].onerror = function (errorMessage, scriptURI, lineNo, columnNo, error) {
    requestEvent(monitorUrl, {
      event_type: 'design_iframeError',
      url: window.location.href,
      unit: getUrlUnit(),
      content: JSON.stringify({
        errorMessage: errorMessage,
        scriptURI: scriptURI,
        columnNo: columnNo,
        error: error
      })
    })
  }
}

export const initMonitor = (url) => {
  monitorUrl = url
  globalMonitoring()
  promiseMonitoring()
}
