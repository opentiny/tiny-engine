import { BUILTIN_COMPONENT_NAME, JS_EXPRESSION, JS_FUNCTION, JS_I18N, JS_RESOURCE, JS_SLOT } from '@/constant'
import { isOn, toEventKey, thisBindRe, randomString } from '@/utils'
import { strategy } from '@/parser/state-type'
import { unwrapExpression } from '@/parser/state'

export const generateTemplateCondition = (condition) => {
  if (typeof condition === 'boolean') {
    return `v-if=${condition}`
  }

  if (!condition?.type) {
    return ''
  }

  if (condition?.kind === 'else') {
    return 'v-else'
  }

  const conditionValue = condition?.value?.replace(thisBindRe, '')

  return `v-${condition?.kind || 'if'}=${conditionValue}`
}

export const generateLoopTemplate = (loop, loopArgs) => {
  // 没有设置循环，返回空字符
  if (!loop) {
    return ''
  }

  const source = (loop?.value || '').replace(thisBindRe, '')
  const iterVar = [...loopArgs]

  return `v-for="(${iterVar.join(',')}) in ${source}"`
}

const handleEventBinding = (key, item) => {
  const eventKey = toEventKey(key)
  let eventBinding = ''

  // vue 事件绑定，仅支持：内联事件处理器 or 方法事件处理器（绑定方法名或对某个方法的调用）
  if (item?.type === JS_EXPRESSION) {
    const eventHandler = item.value.replace(thisBindRe, '')

    // Vue Template 中，为事件处理函数传递额外的参数时，需要使用内联箭头函数
    if (item.params?.length) {
      const extendParams = item.params.join(',')
      eventBinding = `@${eventKey}="(...eventArgs) => ${eventHandler}(eventArgs, ${extendParams})"`
    } else {
      eventBinding = `@${eventKey}="${eventHandler}"`
    }
  }

  return eventBinding
}

export const handleAttributeKey = (key) => {
  const specialKey = {
    className: 'class'
  }

  if (specialKey[key]) {
    return specialKey
  }

  return key
}

export const genSlotBinding = (props = {}) => {
  const { slot } = props

  if (!slot) {
    return ''
  }

  if (typeof slot === 'string') {
    return `#${slot}`
  }

  const { name, params } = slot

  let paramsValue = ''

  if (Array.isArray(params)) {
    paramsValue = `={ ${params.join(',')} }`
  } else if (typeof params === 'string') {
    paramsValue = `="${params}"`
  }

  return `#${name}${paramsValue}`
}

export const handlePrimitiveBinding = (key, value) => {
  const varBinding = ['boolean', 'number'].includes(typeof value) ? ':' : ''

  return `${varBinding}${key}=${value}`
}

const specialTypes = [JS_FUNCTION, JS_RESOURCE, JS_SLOT]

export const checkHasSpecialType = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  for (const item of Object.values(obj)) {
    if (typeof item !== 'object') {
      continue
    }

    if (specialTypes.includes(item?.type) || checkHasSpecialType(item)) {
      return true
    }
  }

  return false
}

export const mergeDescription = (oldDesc, newDesc) => {
  oldDesc.hasJSX = oldDesc.hasJSX || newDesc.hasJSX
  oldDesc.jsResource.utils = oldDesc.jsResource.utils || newDesc.jsResource.utils
  oldDesc.jsResource.bridge = oldDesc.jsResource.bridge || newDesc.jsResource.bridge
}

const transformSpecialType = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return
  }

  let res = {}
  let description = {
    hasJSX: false,
    jsResource: { utils: false, bridge: false }
  }

  if (Array.isArray(obj)) {
    res = []
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object') {
      res[key] = value
      continue
    }

    if (specialTypes?.includes(value?.type)) {
      res[key] = strategy[value.type](value, description)

      continue
    }

    const { res: tempRes, description: desc = {} } = transformSpecialType(value) || {}

    if (tempRes) {
      res[key] = tempRes
    }

    mergeDescription(description, desc)
  }

  return {
    res,
    description
  }
}

export const handleObjectBinding = (key, value) => {
  let shouldBindToState = false

  if (!value || typeof value !== 'object') {
    return {
      shouldBindToState,
      resultStr: ''
    }
  }

  const hasSpecialType = checkHasSpecialType(value)

  const { res = '', description = {} } = transformSpecialType(value) || {}

  return {
    hasSpecialType,
    res,
    description
  }
}

const handleJSExpressionBinding = (key, value) => {
  // 支持带参数的 v-model
  if (value.model) {
    const modelArgs = value.model?.prop ? `:${value.model.prop}` : ''

    return `v-model${modelArgs}="${value.value.replace(thisBindRe, '')}"`
  }

  // expression 使用 v-bind 绑定
  return `:${key}="${value.value.replace(thisBindRe, '')}"`
}

const handleBindI18n = (key, value) => {
  const tArguments = [`'${value.key}'`]
  // TODO: 拿到场景用例
  const i18nParams = JSON.stringify(value.params)

  i18nParams && tArguments.push(i18nParams)

  return `:${key}="t(${tArguments.join(',')})"`
}

export const generateAttribute = (schema) => {
  const { condition, loop, loopArgs, props, componentName } = schema

  const finalRes = {
    description: {
      hasJSX: false,
      jsResource: { utils: false, bridge: false }
    },
    stateVariable: {}
  }

  let resultArr = []

  // 处理 v-if 绑定
  const conditionStr = generateTemplateCondition(condition)

  resultArr.push(conditionStr)

  // 处理 v-for 绑定

  const loopStr = generateLoopTemplate(loop, loopArgs)

  resultArr.push(loopStr)

  const slotBindingStr = genSlotBinding(props)

  resultArr.push(slotBindingStr)

  // 处理 ComponentName 为 template 的场景，不应该再有其他属性
  if (componentName === BUILTIN_COMPONENT_NAME.TEMPLATE) {
    return resultArr.join(' ')
  }

  Object.entries(props).forEach(([key, value]) => {
    if (key === 'slot') {
      return
    }

    if (isOn(key)) {
      const eventBindStr = handleEventBinding(key, value)

      resultArr.push(eventBindStr)

      return
    }

    // 处理特殊的 key，比如 className -> class
    const actualKey = handleAttributeKey(key)

    // 基本类型值绑定
    if (typeof value !== 'object') {
      const primitiveStr = handlePrimitiveBinding(actualKey, value)

      resultArr.push(primitiveStr)

      return
    }

    // 处理 expression 类型值绑定
    if (value?.type === JS_EXPRESSION) {
      const expressionStr = handleJSExpressionBinding(actualKey, value)

      resultArr.push(expressionStr)

      return
    }

    // 处理 i18n 绑定
    if (value?.type === JS_I18N) {
      resultArr.push(handleBindI18n(actualKey, value))

      return
    }

    // 处理 object 绑定
    const { res, hasSpecialType, description } = handleObjectBinding(actualKey, value)

    // 有特殊类型说明不能直接拼接到 template attribute 中
    if (hasSpecialType) {
      const stateValueKey = `${key}${randomString()}`
      resultArr.push(`:${key}=state.${stateValueKey}`)

      finalRes.stateVariable[stateValueKey] = res
    } else {
      const unWrapValue = unwrapExpression(JSON.stringify(res))
        .replace(/props\./g, '')
        .replace(/"/g, '&quot;')

      resultArr.push(`:${key}=${unWrapValue}`)
    }

    mergeDescription(finalRes.description, description)
  })

  return {
    ...finalRes,
    resultStr: resultArr.join(' ')
  }
}

export const handleConditionAttrHook = (schemaData) => {
  const { resArr, schema } = schemaData
  const { condition } = schema

  if (typeof condition === 'boolean') {
    resArr.unshift(`v-if=${condition}`)
    return
  }

  if (!condition?.type) {
    return
  }

  if (condition?.kind === 'else') {
    resArr.unshift('v-else')
  }

  const conditionValue = condition?.value?.replace(thisBindRe, '')

  resArr.unshift(`v-${condition?.kind || 'if'}=${conditionValue}`)
}

export const handleLoopAttrHook = (schemaData = {}) => {
  const { resArr, schema } = schemaData
  const { loop, loopArgs } = schema || {}

  if (!loop) {
    return
  }

  const source = (loop?.value || '').replace(thisBindRe, '')
  const iterVar = [...loopArgs]

  resArr.push(`v-for="(${iterVar.join(',')}) in ${source}"`)
}

export const handleEventAttrHook = (schemaData) => {
  const { resArr, props } = schemaData

  const eventBindArr = Object.entries(props)
    .filter(([key]) => isOn(key))
    .map(([key, value]) => handleEventBinding(key, value))

  resArr.push(...eventBindArr)
}

// 处理基本类似的 attribute，如 string、boolean
export const handlePrimitiveAttributeHook = (schemaData) => {
  const { resArr, props } = schemaData

  for (const [key, value] of Object.entries(props)) {
    const valueType = typeof value
    const renderKey = handleAttributeKey(key)

    if (valueType === 'string') {
      resArr.push(`${renderKey}=${value}`)

      delete props[key]
    }

    if (['boolean', 'number'].includes(valueType)) {
      resArr.push(`:${renderKey}=${value}`)

      delete props[key]
    }
  }
}
