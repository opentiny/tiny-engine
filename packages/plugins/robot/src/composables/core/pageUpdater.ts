import { jsonrepair } from 'jsonrepair'
import * as jsonpatch from 'fast-json-patch'
import { utils } from '@opentiny/tiny-engine-utils'
import { useCanvas, useHistory } from '@opentiny/tiny-engine-meta-register'
import { useThrottleFn } from '@vueuse/core'
import useModelConfig from './useConfig'
import { fixMethods, schemaAutoFix, getJsonObjectString, isValidFastJsonPatch, jsonPatchAutoFix } from '../../utils'

const { deepClone } = utils

const logger = console

const setSchema = (schema: object) => {
  const { importSchema, setSaved } = useCanvas()
  importSchema(schema)
  setSaved(false)
}

const _updatePageSchema = (streamContent: string, currentPageSchema: object, isFinial: boolean = false) => {
  const { robotSettingState, CHAT_MODE } = useModelConfig()
  if (robotSettingState.chatMode !== CHAT_MODE.Agent) {
    return
  }

  // 解析流式返回的schema patch
  let content = getJsonObjectString(streamContent)
  let jsonPatches = []
  try {
    if (!isFinial) {
      content = jsonrepair(content)
    }
    jsonPatches = JSON.parse(content)
  } catch (error) {
    if (isFinial) {
      logger.error('parse json patch error:', error)
    }
    return { isError: true, error }
  }

  // 过滤有效的json patch
  if (!isFinial && !isValidFastJsonPatch(jsonPatches)) {
    return { isError: true, error: 'format error: not a valid json patch.' }
  }
  const validJsonPatches = jsonPatchAutoFix(jsonPatches, isFinial)

  // 生成新schema
  const originSchema = deepClone(currentPageSchema)
  const newSchema = validJsonPatches.reduce((acc: object, patch: any) => {
    try {
      return jsonpatch.applyPatch(acc, [patch], false, false).newDocument
    } catch (error) {
      if (isFinial) {
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
  if (isFinial) {
    useHistory().addHistory()
  }

  return { schema: newSchema, isError: false }
}

export const updatePageSchema = useThrottleFn(_updatePageSchema, 200, true)
