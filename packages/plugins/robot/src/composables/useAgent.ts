import { jsonrepair } from 'jsonrepair'
import { checkComponentNameExists } from '../js/utils'
import * as jsonpatch from 'fast-json-patch'
import { utils } from '@opentiny/tiny-engine-utils'
import { useCanvas, useHistory } from '@opentiny/tiny-engine-meta-register'
import useRobot from '../js/useRobot'
import SvgICons from '@opentiny/vue-icon'

const { string2Obj, reactiveObj2String: obj2String, deepClone } = utils
import { useThrottleFn } from '@vueuse/core'

const setSchema = (schema: object) => {
  const { importSchema, setSaved } = useCanvas()
  importSchema(schema)
  setSaved(false)
}

const fixInvalidIconComponent = (data: any) => {
  if (data.componentName === 'Icon' && data.props?.name && !SvgICons[data.props.name as keyof typeof SvgICons]) {
    data.props.name = 'IconWarning'
  }

  if (data.children && Array.isArray(data.children)) {
    data.children.forEach((child: any) => fixInvalidIconComponent(child))
  }
}

const updateStreamCanvasPageSchema = async (streamContent: string, currentPageSchema: object) => {
  try {
    const repaired = jsonrepair(streamContent)
    const parsedJson = JSON.parse(repaired)
    const latestPatch = parsedJson.at(-1)
    if (latestPatch?.path && !latestPatch.path.startsWith('/children')) {
      parsedJson.pop()
    }
    const result = parsedJson.reduce((acc: object, patch: any) => {
      fixInvalidIconComponent(patch.value)
      return jsonpatch.applyPatch(acc, [patch], false, false).newDocument
    }, deepClone(currentPageSchema))
    const editorValue = string2Obj(obj2String(result))

    if (editorValue && checkComponentNameExists(result)) {
      setSchema(result)
    }
  } catch (error) {
    const logger = console
    logger.error('updateStreamCanvasPageSchema error', error)
  }
}

// 节流更新schema
export const throttledUpdateCanvasPageSchema = useThrottleFn(updateStreamCanvasPageSchema, 500, true)

export const handleStreamData = (streamContent: string, currentJson: object) => {
  const { aiMode, CHAT_MODE } = useRobot()
  if (aiMode.value !== CHAT_MODE.Agent) {
    return
  }
  throttledUpdateCanvasPageSchema(streamContent, currentJson)
}

export const updateCanvasPageSchema = (streamContent: string, currentJson: object, messages: RobotMessage[]) => {
  const { aiMode, CHAT_MODE, isValidFastJsonPatch } = useRobot()
  if (aiMode.value !== CHAT_MODE.Agent) {
    return
  }
  const regex = /```json([\s\S]*?)```/
  const match = streamContent.match(regex)
  const content = (match && match[1]) || streamContent

  try {
    const schemaPatch = JSON.parse(content)
    if (isValidFastJsonPatch(schemaPatch)) {
      const result = schemaPatch.reduce((acc: object, patch: any) => {
        fixInvalidIconComponent(patch.value)
        return jsonpatch.applyPatch(acc, [patch], false, false).newDocument
      }, deepClone(currentJson))
      const logger = console
      logger.log('current schema:', deepClone(currentJson))
      logger.log('new Schema:', result)
      setSchema(result)
      useHistory().addHistory()

      messages.at(-1).renderContent.at(-1).status = 'success'
      messages.at(-1).renderContent.at(-1).schema = result
    }
  } catch (error) {
    const logger = console
    logger.error('updateCanvasPageSchema error', error)
    messages.at(-1).renderContent.at(-1).status = 'failed'
  }
}
