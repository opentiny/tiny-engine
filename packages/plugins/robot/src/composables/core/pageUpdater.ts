import { jsonrepair } from 'jsonrepair'
import * as jsonpatch from 'fast-json-patch'
import { utils } from '@opentiny/tiny-engine-utils'
import { useCanvas, useHistory } from '@opentiny/tiny-engine-meta-register'
import { useThrottleFn } from '@vueuse/core'
import useModelConfig from './useConfig'
import { ChatMode } from '../../types/mode.types'
import { fixMethods, schemaAutoFix, getJsonObjectString, isValidFastJsonPatch, jsonPatchAutoFix } from '../../utils'

const { deepClone } = utils

const logger = console

const setSchema = (schema: object) => {
  const { importSchema, setSaved } = useCanvas()
  importSchema(schema)
  setSaved(false)
}

type UpdateResult =
  | undefined
  | { isError: false; schema: object; error?: undefined }
  | { isError: true; schema?: undefined; error: unknown }

const _updatePageSchema = (
  streamContent: string,
  currentPageSchema: object,
  isFinal: boolean = false
): UpdateResult => {
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
  schemaAutoFix(newSchema.children)

  // 更新Schema
  setSchema(newSchema)
  if (isFinal) {
    useHistory().addHistory()
  }

  return { schema: newSchema, isError: false }
}

export const updatePageSchema = useThrottleFn(_updatePageSchema, 200, true)
