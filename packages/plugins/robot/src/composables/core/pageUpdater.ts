import { jsonrepair } from 'jsonrepair'
import * as jsonpatch from 'fast-json-patch'
import { utils } from '@opentiny/tiny-engine-utils'
import { useCanvas, useHistory, useMessage } from '@opentiny/tiny-engine-meta-register'
import { useThrottleFn } from '@vueuse/core'
import useModelConfig from './useConfig'
import { ChatMode } from '../../types/mode.types'
import {
  fixMethods,
  schemaAutoFix,
  getJsonObjectString,
  isValidFastJsonPatch,
  isValidSchemaChildren,
  jsonPatchAutoFix
} from '../../utils'

const { deepClone } = utils

const logger = console
let schemaUpdateVersion = 0
let lastSuccessfulSchema: object | null = null

const setSchema = async (schema: object, addHistory = false) => {
  const { importSchema, pageState, setSaved } = useCanvas()

  if (addHistory) {
    importSchema(schema)
    useHistory().addHistory()
  } else {
    Object.assign(pageState.pageSchema, schema)
    useMessage().publish({ topic: 'schemaChange', data: {} })
  }
  setSaved(false)
  lastSuccessfulSchema = schema
}

type UpdateResult =
  | undefined
  | { isError: false; schema: object; error?: undefined }
  | { isError: true; schema?: undefined; error: unknown }

const _updatePageSchema = async (
  streamContent: string,
  currentPageSchema: object,
  isFinal: boolean = false,
  version = schemaUpdateVersion
): Promise<UpdateResult> => {
  if (version !== schemaUpdateVersion) {
    return
  }

  const { getSelectedModelInfo } = useModelConfig()
  if (getSelectedModelInfo().config?.chatMode !== ChatMode.Agent) {
    return
  }

  // 解析流式返回的schema patch
  let content = getJsonObjectString(streamContent)
  let jsonPatches = []
  try {
    if (!isFinal) {
      content = jsonrepair(content)
    }
    jsonPatches = JSON.parse(content)
  } catch (error) {
    if (isFinal) {
      logger.error('parse json patch error:', error)
    }
    return { isError: true, error }
  }

  // 过滤有效的json patch
  if (!isFinal && !isValidFastJsonPatch(jsonPatches)) {
    return { isError: true, error: 'format error: not a valid json patch.' }
  }
  const validJsonPatches = jsonPatchAutoFix(jsonPatches, isFinal)

  // 生成新schema
  const originSchema = deepClone(currentPageSchema)
  const newSchema = validJsonPatches.reduce((acc: object, patch: any) => {
    try {
      return jsonpatch.applyPatch(acc, [patch], false, false).newDocument
    } catch (error) {
      if (isFinal) {
        logger.error('apply patch error:', error, patch)
      }
      return acc
    }
  }, originSchema)

  // schema纠错
  fixMethods(newSchema.methods)
  if (!isValidSchemaChildren(newSchema.children)) {
    return { isError: true, error: 'format error: schema children contains invalid nodes.' }
  }
  schemaAutoFix(newSchema.children)

  // 更新Schema
  try {
    await setSchema(newSchema, isFinal)
  } catch (error) {
    if (isFinal) {
      logger.error('set schema error:', error)
    }
    return { isError: true, error }
  }

  return { schema: newSchema, isError: false }
}

const updatePageSchemaThrottled = useThrottleFn(_updatePageSchema, 200, true)

const invalidatePendingStreamUpdates = () => {
  schemaUpdateVersion++
}

export const resetPageSchemaUpdateState = () => {
  invalidatePendingStreamUpdates()
  lastSuccessfulSchema = null
}

export const getLastSuccessfulPageSchema = () => lastSuccessfulSchema

export const updatePageSchema = (
  streamContent: string,
  currentPageSchema: object,
  isFinal: boolean = false
): UpdateResult | Promise<UpdateResult> => {
  if (isFinal) {
    invalidatePendingStreamUpdates()
    return _updatePageSchema(streamContent, currentPageSchema, isFinal, schemaUpdateVersion)
  }

  return updatePageSchemaThrottled(streamContent, currentPageSchema, isFinal, schemaUpdateVersion)
}
