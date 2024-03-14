import {
  BUILTIN_COMPONENT_NAME,
  JS_EXPRESSION,
  JS_FUNCTION,
  JS_I18N,
  JS_RESOURCE,
  JS_SLOT,
  SPECIAL_UTILS_TYPE,
  INSERT_POSITION,
  TINY_ICON
} from '@/constant'
import { isOn, toEventKey, thisBindRe, randomString, getFunctionInfo, hasAccessor } from '@/utils'
import { strategy } from '@/parser/state-type'
import { unwrapExpression } from '@/parser/state'
import { recursiveGenTemplateByHook } from './generateTemplate'

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

const handleEventBinding = (key, item, isJSX) => {
  const eventKey = toEventKey(key)
  let eventBinding = ''

  // vue 事件绑定，仅支持：内联事件处理器 or 方法事件处理器（绑定方法名或对某个方法的调用）
  if (item?.type === JS_EXPRESSION) {
    let eventHandler = item.value.replace(thisBindRe, '')
    let renderKey = isJSX ? `${key}` : `@${eventKey}`

    // Vue Template 中，为事件处理函数传递额外的参数时，需要使用内联箭头函数
    if (item.params?.length) {
      const extendParams = item.params.join(',')
      eventHandler = `(...eventArgs) => ${eventHandler}(eventArgs, ${extendParams})`
    }

    if (isJSX) {
      eventHandler = `{${eventHandler}}`
    } else {
      eventHandler = `"${eventHandler}"`
    }

    eventBinding = `${renderKey}=${eventHandler}`
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

const handleJSExpressionBinding = (key, value, isJSX) => {
  const expressValue = value.value.replace(thisBindRe, '')

  if (isJSX) {
    return `${key}={${expressValue}}`
  }

  // 支持带参数的 v-model
  if (value.model) {
    const modelArgs = value.model?.prop ? `:${value.model.prop}` : ''

    return `v-model${modelArgs}="${expressValue}"`
  }

  // expression 使用 v-bind 绑定
  return `:${key}="${expressValue}"`
}

const handleBindI18n = (key, value, isJSX) => {
  const tArguments = [`'${value.key}'`]
  // TODO: 拿到场景用例
  const i18nParams = JSON.stringify(value.params)

  i18nParams && tArguments.push(i18nParams)

  if (isJSX) {
    return `${key}={t(${tArguments.join(',')})}`
  }

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

const handleJSXConditionBind = (schemaData, globalHooks, config) => {
  const { prefix, suffix, schema: { condition } = {} } = schemaData
  const isJSX = config.isJSX

  if (!isJSX) {
    return
  }

  if (typeof condition !== 'boolean' && !condition?.type) {
    return
  }

  if (prefix[0] !== '{') {
    prefix.unshift('{')
  }

  if (suffix.at(-1) !== '}') {
    suffix.push('}')
  }

  if (typeof condition === 'boolean') {
    prefix.push(`${condition} && `)

    return
  }

  const conditionValue = condition?.value?.replace(thisBindRe, '')

  prefix.push(`${conditionValue} &&`)
}

export const handleConditionAttrHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { condition } = {} } = schemaData
  const isJSX = config.isJSX

  if (isJSX) {
    handleJSXConditionBind(schemaData, globalHooks, config)

    return
  }

  if (typeof condition === 'boolean') {
    attributes.unshift(`v-if=${condition}`)
    return
  }

  if (!condition?.type) {
    return
  }

  const conditionValue = condition?.value?.replace(thisBindRe, '')

  if (condition?.kind === 'else') {
    attributes.unshift('v-else')
  }

  attributes.unshift(`v-${condition?.kind || 'if'}=${conditionValue}`)
}

export const handleLoopAttrHook = (schemaData = {}, globalHooks, config) => {
  const { prefix, suffix, attributes, schema: { loop, loopArgs } = {} } = schemaData
  const isJSX = config.isJSX

  if (!loop) {
    return
  }

  let source = ''

  if (loop?.value && loop?.type) {
    source = loop.value.replace(thisBindRe, '')
  } else {
    source = JSON.stringify(loop)
  }

  const iterVar = [...loopArgs]

  if (!isJSX) {
    attributes.push(`v-for="(${iterVar.join(',')}) in ${source}"`)

    return
  }

  prefix.push(`${source}.map((${iterVar.join(',')}) => `)
  suffix.unshift(`)`)

  if (prefix[0] !== '{') {
    prefix.unshift['{']
  }

  if (suffix.at(-1) !== '}') {
    suffix.push('}')
  }
}

export const handleEventAttrHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}
  const isJSX = config.isJSX

  const eventBindArr = Object.entries(props)
    .filter(([key]) => isOn(key))
    .map(([key, value]) => handleEventBinding(key, value, isJSX))

  attributes.push(...eventBindArr)
}

export const handleSlotBindAttrHook = (schemaData) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}

  const slot = props?.slot

  if (!slot) {
    return
  }

  if (typeof slot === 'string') {
    attributes.push(`#${slot}`)

    delete props.slot

    return
  }

  const { name, params } = slot

  let paramsValue = ''

  if (Array.isArray(params)) {
    paramsValue = `={ ${params.join(',')} }`
  } else if (typeof params === 'string') {
    paramsValue = `="${params}"`
  }

  attributes.push(`#${name}${paramsValue}`)

  delete props.slot
}

export const handleAttrKeyHook = (schemaData) => {
  const { schema: { props = {} } = {} } = schemaData
  const specialKey = {
    className: 'class'
  }

  Object.keys(props || {}).forEach((key) => {
    if (specialKey[key]) {
      props[specialKey[key]] = props[key]

      delete props[key]
    }
  })
}

export const handleExpressionAttrHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}
  const isJSX = config.isJSX

  Object.entries(props).forEach(([key, value]) => {
    if (value?.type === JS_EXPRESSION && !isOn(key)) {
      attributes.push(handleJSExpressionBinding(key, value, isJSX))

      delete props[key]
    }
  })
}

export const handleI18nAttrHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}
  const isJSX = config.isJSX

  Object.entries(props).forEach(([key, value]) => {
    if (value?.type === JS_I18N) {
      attributes.push(handleBindI18n(key, value, isJSX))
    }
  })
}

export const handleTinyIconPropsHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}
  const isJSX = config.isJSX

  Object.entries(props).forEach(([key, value]) => {
    if (value?.componentName === 'Icon' && value?.props?.name) {
      const name = value.props.name
      const iconName = name.startsWith(TINY_ICON) ? name : `Tiny${name}`
      const success = globalHooks.addImport('@opentiny/vue-icon', {
        componentName: name,
        exportName: name,
        package: '@opentiny/vue-icon',
        version: '^3.10.0',
        destructuring: true
      })

      if (success) {
        globalHooks.addStatement({
          position: INSERT_POSITION.BEFORE_PROPS,
          value: `const ${iconName} = ${name}()`,
          key: iconName
        })
      }

      attributes.push(isJSX ? `icon={${iconName}}` : `:icon="${iconName}"`)

      delete props[key]
    }
  })
}

const specialTypeHandler = {
  [JS_EXPRESSION]: ({ value, computed }) => {
    if (computed) {
      return {
        value: `vue.computed(${value.replace(/this\./g, '')})`
      }
    }

    return {
      value: value.replace(/this\./g, '')
    }
  },
  [JS_FUNCTION]: ({ value }) => {
    const { type, params, body } = getFunctionInfo(value)
    const inlineFunc = `${type} (${params.join(',')}) => { ${body.replace(/this\./g, '')} }`

    return {
      value: inlineFunc
    }
  },
  [JS_I18N]: ({ key }) => {
    return {
      value: `t("${key}")`
    }
  },
  [JS_RESOURCE]: ({ value }, globalHooks) => {
    const resourceType = value.split('.')[1]

    if (SPECIAL_UTILS_TYPE.includes(resourceType)) {
      globalHooks.addStatement({
        position: INSERT_POSITION.AFTER_PROPS,
        value: `const { ${resourceType} } = wrap(function() { return this })()`,
        key: resourceType
      })
    }

    return {
      value: value.replace(/this\./g, '')
    }
  },
  [JS_SLOT]: ({ value = [], params = ['row'] }, globalHooks, config) => {
    globalHooks.setScriptConfig({ lang: 'jsx' })

    const structData = {
      children: [],
      schema: { children: value }
    }

    // TODO: 需要验证 template 的生成有无问题
    recursiveGenTemplateByHook(structData, globalHooks, { ...config, isJSX: true })

    // TODO: 这里不通用，需要设计通用的做法，或者独立成 grid 的 hook

    return {
      value: `({${params.join(',')}}, h) => ${structData.children.join('')}`
    }
  }
}

export const transformObjType = (obj, globalHooks, config) => {
  if (!obj || typeof obj !== 'object') {
    return
  }

  let res = {}
  let shouldBindToState = false

  if (Array.isArray(obj)) {
    res = []
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== 'object') {
      res[key] = value

      continue
    }

    if (specialTypeHandler[value?.type]) {
      res[key] = specialTypeHandler[value.type](value, globalHooks, config)?.value || ''

      if (specialTypes.includes(value.type)) {
        shouldBindToState = true
      }

      continue
    }

    if (hasAccessor(value?.accessor)) {
      res[key] = value.defaultValue

      globalHooks.addStatement({
        position: INSERT_POSITION.AFTER_METHODS,
        value: value.accessor.getter?.value || value.accessor.setter?.value
      })
    }

    const { res: tempRes, shouldBindToState: tempShouldBindToState } =
      transformObjType(value, globalHooks, config) || {}

    res[key] = tempRes

    if (tempShouldBindToState) {
      shouldBindToState = true
    }
  }

  return {
    shouldBindToState,
    res
  }
}

export const handleObjBindAttrHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}

  const isJSX = config.isJSX

  Object.entries(props).forEach(([key, value]) => {
    if (!value || typeof value !== 'object') {
      return
    }

    if ([JS_EXPRESSION, JS_I18N].includes(value?.type)) {
      return
    }

    const { res, shouldBindToState } = transformObjType(value, globalHooks, config)

    if (shouldBindToState && !isJSX) {
      let stateKey = key
      let addSuccess = globalHooks.addState(key, res)

      while (!addSuccess) {
        stateKey = `${key}${randomString()}`
        addSuccess = globalHooks.addState(stateKey, res)
      }

      attributes.push(`:${key}="state.${stateKey}"`)
    } else {
      attributes.push(isJSX ? `${key}={${JSON.stringify(res)}}` : `:${key}="${JSON.stringify(res)}"`)
    }

    delete props[key]
  })
}

// 处理基本类似的 attribute，如 string、boolean
export const handlePrimitiveAttributeHook = (schemaData, globalHooks, config) => {
  const { attributes } = schemaData
  const props = schemaData.schema?.props || {}
  const isJSX = config.isJSX

  for (const [key, value] of Object.entries(props)) {
    const valueType = typeof value

    if (valueType === 'string') {
      attributes.push(`${key}="${value}"`)

      delete props[key]
    }

    if (['boolean', 'number'].includes(valueType)) {
      attributes.push(isJSX ? `${key}={${value}}` : `:${key}="${value}"`)

      delete props[key]
    }
  }
}
