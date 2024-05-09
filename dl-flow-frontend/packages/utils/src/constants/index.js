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

import * as utils from '../utils'

export const MATERIAL_TYPE = {
  Component: 'component',
  Block: 'block'
}

export const NODE_INSERT_TYPE = {
  Inside: 'inside',
  After: 'after',
  Before: 'before',
  Replace: 'replace'
}

export const PROP_DATA_TYPE = {
  I18N: 'i18n',
  VARIABLE: 'variable',
  JSEXPRESSION: 'JSExpression',
  JSRESOURCE: 'JSResource',
  JSSLOT: 'JSSlot'
}

export const EXPRESSION_TYPE = {
  JS_FUNCTION: 'JSFunction',
  JS_EXPRESSION: 'JSExpression'
}

export const PLUGIN_NAME = {
  Materials: 'Materials',
  AppManage: 'AppManage',
  BlockManage: 'BlockManage',
  PageController: 'PageController',
  Lock: 'Lock',
  OutlineTree: 'OutlineTree',
  save: 'save'
}

export const LOCALE = {
  zh_CN: 'zh_CN',
  en_US: 'en_US'
}

export const COMPONENT_NAME = {
  Page: 'Page',
  Block: 'Block',
  Folder: 'Folder'
}

export const ELEMENT_TAG = {
  Body: 'body',
  Div: 'div'
}

export const SCHEMA_DATA_TYPE = {
  JSFunction: 'JSFunction',
  JSExpression: 'JSExpression',
  I18n: 'i18n'
}

export const PAGE_STATUS = {
  Release: 'release',
  Occupy: 'occupy',
  Lock: 'lock',
  Guest: 'guest',
  Empty: 'empty',
  SuperAdmin: 'p_webcenter',
  Developer: 'developer'
}

export const BLOCK_OPENNESS = {
  Private: 0,
  Open: 1,
  Special: 2
}

/**
 * 当前浏览器标签页中 BroadcastChannel 的唯一 id
 * 为了避免在同一个浏览器下打开不同设计器应用造成的消息错乱
 * 频道名字 需要为 channelName + channelId
 */
const CHANNEL_UID = sessionStorage.getItem('BROADCAST_CHANNEL_UID') || utils.guid()

sessionStorage.setItem('BROADCAST_CHANNEL_UID', CHANNEL_UID)

export const BROADCAST_CHANNEL = {
  CanvasLang: `tiny-lowcode-canvas-lang-${CHANNEL_UID}`,
  Notify: `global-notify-${CHANNEL_UID}`,
  SchemaLength: `schema-length-${CHANNEL_UID}`
}

export const TYPES = {
  ErrorType: 'error',
  ObjectType: 'object',
  RegExpType: 'regExp',
  DateType: 'date',
  ArrayType: 'array',
  FunctionType: 'function',
  StringType: 'string',
  NumberType: 'number',
  BooleanType: 'boolean'
}

export const DEFAULT_LOOP_NAME = {
  INDEX: 'index',
  ITEM: 'item'
}

export const HOST_TYPE = {
  App: 'app',
  Block: 'block'
}

export const ENVIRONMENTS = {
  Alpha: ['alpha'],
  Prod: ['prod'],
  Development: ['development']
}

// 数据源默认拦截器
export const DEFAULT_INTERCEPTOR = {
  dataHandler: {
    type: 'JSFunction',
    value: 'function dataHandler(res){\n  return res\n}'
  },
  willFetch: {
    type: 'JSFunction',
    value: 'function willFetch(option) {\n  return option\n}'
  },
  errorHandler: {
    type: 'JSFunction',
    value: 'function errorHandler(err) {\n  return Promise.reject(err)\n}'
  },
  shouldFetch: {
    type: 'JSFunction',
    value: 'function shouldFetch(option) {\n  return true \n}'
  }
}

// 排序方式枚举
export const SORT_TYPE = {
  // 时间顺序
  timeAsc: 'timeAsc',
  // 时间倒序
  timeDesc: 'timeDesc',
  // 字母正序
  alphabetAsc: 'alphabetAsc',
  // 字母倒序
  alphabetDesc: 'alphabetDesc'
}
