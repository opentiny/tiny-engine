import { jsonrepair } from 'jsonrepair'
import * as jsonpatch from 'fast-json-patch'
import { utils } from '@opentiny/tiny-engine-utils'
import { getMetaApi, META_SERVICE, useCanvas, useHistory } from '@opentiny/tiny-engine-meta-register'
import SvgICons from '@opentiny/vue-icon'
import { useThrottleFn } from '@vueuse/core'
import useModelConfig from './useConfig'

const { deepClone } = utils

const logger = console

const setSchema = (schema: object) => {
  const { importSchema, setSaved } = useCanvas()
  importSchema(schema)
  setSaved(false)
}

const fixIconComponent = (data: unknown) => {
  if (data?.componentName === 'Icon' && data.props?.name && !SvgICons[data.props.name as keyof typeof SvgICons]) {
    data.props.name = 'IconWarning'
    logger.log('autofix icon to warning:', data)
  }
}

const isPlainObject = (value: unknown) =>
  typeof value === 'object' && value !== null && Object.prototype.toString.call(value) === '[object Object]'

const fixComponentName = (data: object) => {
  if (isPlainObject(data) && !data.componentName) {
    data.componentName = 'div'
    logger.log('autofix component to div:', data)
  }
}

const schemaAutoFix = (data: object | object[]) => {
  if (!data) return
  if (Array.isArray(data)) data.forEach((item) => schemaAutoFix(item))
  fixIconComponent(data)
  fixComponentName(data)
  if (data.children && Array.isArray(data.children)) {
    data.children.forEach((child: any) => schemaAutoFix(child))
  }
}

const isValidOperation = (operation: object) => {
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

const isValidFastJsonPatch = (patch) => {
  if (Array.isArray(patch)) {
    return patch.every(isValidOperation)
  } else if (typeof patch === 'object' && patch !== null) {
    return isValidOperation(patch)
  }
  return false
}

const jsonPatchAutoFix = (jsonPatches: any[], isFinial: boolean) => {
  // 流式渲染过程中，画布只渲染children字段，避免不完整的methods/states/css等字段导致解析报错
  const childrenFilter = (patch, index, arr) =>
    isFinial || index < arr.length - 1 || (index === arr.length - 1 && patch.path?.startsWith('/children'))
  const validJsonPatches = jsonPatches.filter(childrenFilter).filter(isValidFastJsonPatch)

  return validJsonPatches
}

const _updatePageSchema = (streamContent: string, currentPageSchema: object, isFinial: boolean = false) => {
  const { robotSettingState, CHAT_MODE } = useModelConfig()
  if (robotSettingState.chatMode !== CHAT_MODE.Agent) {
    return
  }

  // 解析流式返回的schema patch
  const regex = /```(json|schema)?([\s\S]*?)```/
  const match = streamContent.match(regex)
  let content = (match && match[2]) || streamContent
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
  schemaAutoFix(newSchema.children)

  // 更新Schema
  setSchema(newSchema)
  if (isFinial) {
    useHistory().addHistory()
  }

  return { schema: newSchema, isError: false }
}

export const updatePageSchema = useThrottleFn(_updatePageSchema, 200, true)

export const search = async (content: string) => {
  let result = ''
  const MAX_SEARCH_LENGTH = 8000
  try {
    const res = await getMetaApi(META_SERVICE.Http).post('/app-center/api/ai/search', { content })

    res.forEach((item: { content: string }) => {
      if (result.length + item.content.length > MAX_SEARCH_LENGTH) {
        return
      }
      result += item.content
    })
  } catch (error) {
    // error
  }
  return result
}

export const fetchAssets = async () => {
  const res = (await getMetaApi(META_SERVICE.Http).get('/material-center/api/resource/find/1')) || []
  return res
    .filter((item) => item.description)
    .map((item) => ({
      url: item.resourceUrl,
      describe: item.description
    }))
}
