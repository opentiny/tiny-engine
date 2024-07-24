import {
  JS_EXPRESSION,
  JS_FUNCTION,
  JS_I18N,
  JS_RESOURCE,
  JS_SLOT,
  SPECIAL_UTILS_TYPE,
  INSERT_POSITION,
  TINY_ICON
} from '@/constant'
import {
  isOn,
  toEventKey,
  thisPropsBindRe,
  randomString,
  getFunctionInfo,
  hasAccessor,
  thisRegexp,
  isGetter,
  isSetter
} from '@/utils'
import { recursiveGenTemplateByHook } from './generateTemplate'
import { getImportMap } from './parseImport'

const handleEventBinding = (key, item, isJSX) => {
  const eventKey = toEventKey(key)
  let eventBinding = ''

  // vue 事件绑定，仅支持：内联事件处理器 or 方法事件处理器（绑定方法名或对某个方法的调用）
  if (item?.type === JS_EXPRESSION) {
    let eventHandler = item.value.replace(isJSX ? thisRegexp : thisPropsBindRe, '')
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

const handleJSExpressionBinding = (key, value, isJSX) => {
  const expressValue = value.value.replace(isJSX ? thisRegexp : thisPropsBindRe, '')

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

  const conditionValue = condition?.value?.replace(thisRegexp, '')

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
    attributes.unshift(`v-if="${condition}"`)
    return
  }

  if (!condition?.type) {
    return
  }

  const conditionValue = condition?.value?.replace(isJSX ? thisRegexp : thisPropsBindRe, '')

  if (condition?.kind === 'else') {
    attributes.unshift('v-else')
  }

  attributes.unshift(`v-${condition?.kind || 'if'}="${conditionValue}"`)
}

export const handleLoopAttrHook = (schemaData = {}, globalHooks, config) => {
  const { prefix, suffix, attributes, schema: { loop, loopArgs = [] } = {} } = schemaData
  const isJSX = config.isJSX

  if (!loop) {
    return
  }

  let source = ''

  if (loop?.value && loop?.type) {
    source = loop.value.replace(isJSX ? thisRegexp : thisPropsBindRe, '')
  } else {
    source = JSON.stringify(loop).replaceAll("'", "\\'").replaceAll(/"/g, "'")
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
    paramsValue = `="{ ${params.join(',')} }"`
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

export const specialTypeHandler = {
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
        position: INSERT_POSITION.BEFORE_STATE,
        value: `const { ${resourceType} } = wrap(function() { return this })()`,
        key: resourceType
      })
    }

    return {
      value: `${value.replace(/this\./g, '')}`
    }
  },
  [JS_SLOT]: ({ value = [], params = ['row'] }, globalHooks, config) => {
    globalHooks.setScriptConfig({ lang: 'jsx' })

    const structData = {
      children: [],
      schema: { children: value }
    }

    const { pkgMap = {}, blockPkgMap = {} } = getImportMap(structData.schema, config.componentsMap, config)

    Object.entries({ ...pkgMap, ...blockPkgMap }).forEach(([key, value]) => {
      value.forEach((valueItem) => {
        globalHooks.addImport(key, valueItem)
      })
    })

    // TODO: 需要验证 template 的生成有无问题
    recursiveGenTemplateByHook(structData, globalHooks, { ...config, isJSX: true })

    // TODO: 这里不通用，需要设计通用的做法，或者独立成 grid 的 hook
    return {
      value: `({${params.join(',')}}, h) => ${structData.children.join('')}`
    }
  }
}

export const handleExpressionAttrHook = (schemaData, globalHooks, config) => {
  const { attributes, schema: { props = {} } = {} } = schemaData || {}
  const isJSX = config.isJSX

  Object.entries(props).forEach(([key, value]) => {
    if (value?.type === JS_EXPRESSION && !isOn(key)) {
      specialTypeHandler[JS_RESOURCE](value, globalHooks, config)
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
      const exportName = name.replace(TINY_ICON, 'icon')
      const success = globalHooks.addImport('@opentiny/vue-icon', {
        componentName: exportName,
        exportName: exportName,
        package: '@opentiny/vue-icon',
        version: '^3.10.0',
        destructuring: true
      })

      if (success) {
        globalHooks.addStatement({
          position: INSERT_POSITION.BEFORE_PROPS,
          value: `const ${iconName} = ${exportName}()`,
          key: iconName
        })
      }

      attributes.push(isJSX ? `icon={${iconName}}` : `:icon="${iconName}"`)

      delete props[key]
    }
  })
}

export const transformObjType = (obj, globalHooks, config) => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  let resStr = []
  let shouldBindToState = false
  let shouldRenderKey = !Array.isArray(obj)

  for (const [key, value] of Object.entries(obj)) {
    let renderKey = shouldRenderKey ? `${key}: ` : ''

    if (typeof value === 'string') {
      resStr.push(`${renderKey}"${value.replaceAll("'", "\\'").replaceAll(/"/g, "'")}"`)

      continue
    }

    if (typeof value !== 'object' || value === null) {
      resStr.push(`${renderKey}${value}`)

      continue
    }

    if (specialTypeHandler[value?.type]) {
      const specialVal = specialTypeHandler[value.type](value, globalHooks, config)?.value || ''
      resStr.push(`${renderKey}${specialVal}`)

      if (specialTypes.includes(value.type)) {
        shouldBindToState = true
      }

      continue
    }

    if (hasAccessor(value?.accessor)) {
      resStr.push(`${renderKey}${value.defaultValue || "''"}`)

      if (isSetter(value?.accessor)) {
        globalHooks.addStatement({
          position: INSERT_POSITION.AFTER_METHODS,
          value: `vue.watchEffect(wrap(${value.accessor.setter?.value ?? ''}))`
        })
      }

      if (isGetter(value?.accessor)) {
        globalHooks.addStatement({
          position: INSERT_POSITION.AFTER_METHODS,
          value: `vue.watchEffect(wrap(${value.accessor.getter?.value ?? ''}))`
        })
      }

      continue
    }

    const { res: tempRes, shouldBindToState: tempShouldBindToState } =
      transformObjType(value, globalHooks, config) || {}

    resStr.push(`${renderKey}${tempRes}`)

    if (tempShouldBindToState) {
      shouldBindToState = true
    }
  }

  return {
    shouldBindToState,
    res: Array.isArray(obj) ? `[${resStr.join(',')}]` : `{ ${resStr.join(',')} }`
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
      let addSuccess = globalHooks.addState(stateKey, `${stateKey}:${res}`)

      while (!addSuccess) {
        stateKey = `${key}${randomString()}`
        addSuccess = globalHooks.addState(stateKey, `${stateKey}:${res}`)
      }

      attributes.push(`:${key}="state.${stateKey}"`)
    } else {
      attributes.push(isJSX ? `${key}={${res}}` : `:${key}="${res.replaceAll(/"/g, "'")}"`)
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
      attributes.push(`${key}="${value.replaceAll(/"/g, "'")}"`)

      delete props[key]
    }

    if (['boolean', 'number'].includes(valueType)) {
      attributes.push(isJSX ? `${key}={${value}}` : `:${key}="${value}"`)

      delete props[key]
    }
  }
}

// 检测表达式类型引用 utils 的场景，需要在 script 中声明 utils 表达式
export const handleBindUtilsHooks = (schemaData, globalHooks, config) => {
  const { schema: { props = {} } = {} } = schemaData || {}

  Object.entries(props).forEach(([key, value]) => {
    if (value?.type === JS_EXPRESSION && !isOn(key)) {
      specialTypeHandler[JS_RESOURCE](value, globalHooks, config)
    }
  })
}
