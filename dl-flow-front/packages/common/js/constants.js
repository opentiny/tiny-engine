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

export const BROADCAST_CHANNEL = {
  CanvasLang: 'tiny-lowcode-canvas-lang',
  Notify: 'global-notify',
  AppType: 'app-type'
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

// 转化国际化的映射关系表
export const i18nKeyMaps = {
  zhCN: 'zh_CN',
  enUS: 'en_US'
}
