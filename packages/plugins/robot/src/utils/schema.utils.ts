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

import { jsonrepair } from 'jsonrepair'
import SvgICons from '@opentiny/vue-icon'
import { serializeError } from './chat.utils'

/**
 * 修复图标组件，如果图标不存在则使用警告图标
 */
export const fixIconComponent = (data: any) => {
  if (data?.componentName === 'Icon' && data.props?.name && !SvgICons[data.props.name as keyof typeof SvgICons]) {
    data.props.name = 'IconWarning'
  }
}

/**
 * 检查是否为纯对象
 */
export const isPlainObject = (value: unknown) =>
  typeof value === 'object' && value !== null && Object.prototype.toString.call(value) === '[object Object]'

/**
 * 修复组件名，如果没有组件名则设为div
 */
export const fixComponentName = (data: any) => {
  if (isPlainObject(data) && !data.componentName && !data.op && !data.path) {
    data.componentName = 'div'
  }
}

/**
 * 修复方法对象，确保方法格式正确
 */
export const fixMethods = (methods: Record<string, any>) => {
  if (methods && Object.keys(methods).length) {
    Object.entries(methods).forEach(([methodName, methodValue]: [string, any]) => {
      if (
        typeof methodValue?.value !== 'string' ||
        methodValue?.type !== 'JSFunction' ||
        !methodValue?.value.startsWith('function')
      ) {
        methods[methodName] = {
          type: 'JSFunction',
          value: 'function ' + methodName + '() {\n  console.log("' + methodName + '");\n}'
        }
      }
    })
  }
}

/**
 * 递归修复Schema中的各种问题
 */
export const schemaAutoFix = (data: any) => {
  if (!data) return
  if (Array.isArray(data)) {
    data.forEach((item) => schemaAutoFix(item))
    return
  }

  fixIconComponent(data)
  fixComponentName(data)

  if (data.children && Array.isArray(data.children)) {
    data.children.forEach((child: any) => schemaAutoFix(child))
  }
}

/**
 * 验证JSON Patch操作是否有效
 */
export const isValidOperation = (operation: any): boolean => {
  const allowedOps = ['add', 'remove', 'replace', 'move', 'copy', 'test', '_get']

  if (typeof operation !== 'object' || operation === null) {
    return false
  }

  // 检查操作类型是否有效
  if (!operation.op || !allowedOps.includes(operation.op)) {
    return false
  }

  // 检查path字段是否存在且为字符串
  if (!operation.path || typeof operation.path !== 'string') {
    return false
  }

  // 根据操作类型检查其他必需字段
  switch (operation.op) {
    case 'add':
    case 'replace':
    case 'test':
      if (!('value' in operation)) {
        return false
      }
      break
    case 'move':
    case 'copy':
      if (!operation.from || typeof operation.from !== 'string') {
        return false
      }
      break
  }

  return true
}

/**
 * 验证JSON Patch是否有效
 */
export const isValidFastJsonPatch = (patch: any): boolean => {
  if (Array.isArray(patch)) {
    return patch.every(isValidOperation)
  } else if (typeof patch === 'object' && patch !== null) {
    return isValidOperation(patch)
  }
  return false
}

const isValidSchemaNode = (node: unknown): boolean => {
  if (!isPlainObject(node)) {
    return false
  }

  const children = (node as { children?: unknown }).children
  return !Array.isArray(children) || children.every(isValidSchemaNode)
}

export const isValidSchemaChildren = (children: unknown): boolean =>
  !Array.isArray(children) || children.every(isValidSchemaNode)

/**
 * 自动修复JSON Patch数组，过滤无效操作
 */
export const jsonPatchAutoFix = (jsonPatches: any[], isFinial: boolean) => {
  // 流式渲染过程中，画布只渲染完整的字段或流式的children字段，避免不完整的methods/states/css等字段导致解析报错
  const childrenFilter = (patch: any, index: number, arr: any[]) =>
    isFinial || index < arr.length - 1 || (index === arr.length - 1 && patch.path?.startsWith('/children'))
  const validJsonPatches = jsonPatches.filter(childrenFilter).filter(isValidFastJsonPatch)

  return validJsonPatches
}

/**
 * 从流式内容中提取JSON对象字符串
 */
export const getJsonObjectString = (streamContent: string): string => {
  const regex = /```(json|schema)?([\s\S]*?)```/
  const match = streamContent.match(regex)
  if (match?.[2]) {
    return match[2]
  }

  const arrayStart = streamContent.indexOf('[')
  const arrayEnd = streamContent.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return streamContent.slice(arrayStart, arrayEnd + 1)
  }

  return streamContent
}

/**
 * 验证流式内容是否为有效的JSON Patch对象字符串
 */
export const isValidJsonPatchObjectString = (streamContent: string) => {
  const jsonString = getJsonObjectString(streamContent)
  try {
    let data
    try {
      data = JSON.parse(jsonString)
    } catch {
      data = JSON.parse(jsonrepair(jsonString))
    }
    if (!isValidFastJsonPatch(data)) {
      return {
        isError: true,
        error:
          'format error: not a valid json patch format(strictly `RFC 6902` compliant JSON Patch array. Format example: `[{ "op": "add", "path": "/children/0", "value": { ... } }, {"op":"add","path":"/methods/handleBtnClick","value": { ... }}, { "op": "replace", "path": "/css", "value": "..." }]`), please check and fix the json patch format.'
      }
    }
    return { isError: false, data }
  } catch (error) {
    return { isError: true, error: serializeError(error) }
  }
}

/**
 * 解析和修复JSON字符串
 */
export const parseAndRepairJson = (content: string, isFinial: boolean) => {
  try {
    let repairedContent = content
    if (!isFinial) {
      repairedContent = jsonrepair(content)
    }
    return { data: JSON.parse(repairedContent), isError: false }
  } catch (error) {
    return { isError: true, error }
  }
}
