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

export const REGEXP_EVENT_NAME = /^[a-z]+([A-Z][a-z]*)*$/

export const verifyEventName = (name) => REGEXP_EVENT_NAME.test(name)

export const REGEXP_BLOCK_NAME = /^([A-Z][A-Za-z0-9]{2,})*?([A-Z][A-Za-z0-9]{2,})*?$/

export const verifyBlockName = (string) => REGEXP_BLOCK_NAME.test(string)

export const REGEXP_BLOCK_ID = /^[A-Za-z]+$/

export const verifyBlockId = (string) => REGEXP_BLOCK_ID.test(string)

export const REGEXP_BLOCK_PATH = /^[\w-][/\w-]*?[\w-]*?$/

export const verifyBlockPath = (string) => !string || REGEXP_BLOCK_PATH.test(string)

export const REGEXP_GROUP_NAME = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/

export const REGEXP_REGULAR_STRING = /^[\w-]*$/ // 只能包含英文字母、数字、下横线_、中横线-
export const REGEXP_REGULAR_STRING2 = /^[A-Za-z][\w-]*$/ // 只能包含英文字母、数字、下横线_、中横线-，且以英文字符开头
export const REGEXP_REGULAR_STRING3 = /^[A-Za-z][\w-/]*$/ // 只能包含英文字母、数字、下横线_、中横线-、正斜杠/，且以英文字符开头

export const REGEXP_PAGE_NAME = /^([A-Z][a-z]*?)+$/

export const REGEXP_FOLDER_NAME = REGEXP_REGULAR_STRING2

export const REGEXP_ROUTE = REGEXP_REGULAR_STRING3

export const REGEXP_JS_VAR = /^[a-zA-Z_]\w*$/

export const verifyJsVarName = (name) => REGEXP_JS_VAR.test(name)
