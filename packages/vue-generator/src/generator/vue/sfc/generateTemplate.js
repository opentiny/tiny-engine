import {
  BUILTIN_COMPONENT_NAME,
  BUILTIN_COMPONENT_NAME_MAP,
  TINY_ICON,
  INSERT_POSITION,
  JS_EXPRESSION,
  JS_I18N
} from '@/constant'
import { generateTag } from './generateTag'
import { thisPropsBindRe, thisRegexp } from '@/utils'

export const handleComponentNameHook = (nameObj) => {
  const { componentName, schema } = nameObj

  // 内置 component
  if (!BUILTIN_COMPONENT_NAME_MAP[componentName]) {
    return
  }

  if (componentName === BUILTIN_COMPONENT_NAME.TEXT && schema.props.text) {
    schema.children = [schema.props.text]
    delete schema.props.text
  }

  nameObj.componentName = BUILTIN_COMPONENT_NAME_MAP[componentName]
}

export const handleTinyIcon = (nameObj, globalHooks) => {
  if (BUILTIN_COMPONENT_NAME.ICON !== nameObj.componentName) {
    return
  }

  const name = nameObj.schema.props.name
  const iconName = name.startsWith(TINY_ICON) ? name : `Tiny${name}`
  const exportName = name.replace(TINY_ICON, 'icon')

  const success = globalHooks.addImport('@opentiny/vue-icon', {
    componentName: exportName,
    exportName: exportName,
    package: '@opentiny/vue-icon',
    version: '^3.10.0',
    destructuring: true
  })

  // tiny icon 需要调用
  if (success) {
    globalHooks.addStatement({
      position: INSERT_POSITION.BEFORE_PROPS,
      value: `const ${iconName} = ${exportName}()`,
      key: iconName
    })
  }

  nameObj.componentName = iconName
  delete nameObj.schema.props.name
}

export const handleTinyGrid = (schemaData) => {
  const { componentName, props } = schemaData.schema

  // 同时存在 data 和 fetchData 的时候，删除 data
  if (componentName === 'TinyGrid' && props?.data && props?.fetchData) {
    delete props.data
  }
}

export const handleExpressionChildren = (schemaData = {}, globalHooks, config) => {
  const { children, schema } = schemaData
  const type = schema?.children?.type
  const isJSX = config.isJSX
  const prefix = isJSX ? '{' : '{{'
  const suffix = isJSX ? '}' : '}}'

  if (type === JS_EXPRESSION) {
    children.push(
      `${prefix} ${schema.children?.value.replace(isJSX ? thisRegexp : thisPropsBindRe, '') || ''} ${suffix}`
    )

    delete schema.children
    return
  }

  if (type === JS_I18N && schema.children?.key) {
    children.push(`${prefix} t('${schema.children.key}') ${suffix}`)

    delete schema.children
    return
  }
}

export const validEmptyTemplateHook = (schema = {}) => {
  if (schema.componentName === BUILTIN_COMPONENT_NAME.TEMPLATE && !schema.children?.length) {
    return false
  }

  return true
}

// TODO: 支持物料中自定义出码关联片段

export const recursiveGenTemplateByHook = (schemaWithRes, globalHooks, config = {}) => {
  const schemaChildren = schemaWithRes?.schema?.children || []
  const { hooks = {}, isJSX } = config
  // 自定义 hooks
  const {
    componentName: componentNameHooks,
    attribute: attributeHooks,
    children: childrenHooks,
    templateItemValidate
  } = hooks

  if (!Array.isArray(schemaChildren)) {
    schemaWithRes.children.push(schemaChildren || '')

    return
  }

  const resArr = schemaChildren.map((schemaItem) => {
    for (const validateItem of templateItemValidate) {
      if (!validateItem(schemaItem, globalHooks, config)) {
        return ''
      }
    }

    if (typeof schemaItem !== 'object' || !schemaItem) {
      return schemaItem || ''
    }

    const { componentName, component } = schemaItem

    const optionData = {
      schema: schemaItem,
      voidElement: false,
      componentName: componentName ?? component ?? '',
      prefix: [],
      attributes: [],
      children: [],
      suffix: []
    }

    for (const hookItem of componentNameHooks) {
      hookItem(optionData, globalHooks, config)
    }

    for (const hookItem of attributeHooks) {
      hookItem(optionData, globalHooks, config)
    }

    for (const hookItem of [...childrenHooks, recursiveGenTemplateByHook]) {
      hookItem(optionData, globalHooks, config)
    }

    const startTag = generateTag(optionData.componentName, {
      attribute: optionData.attributes.join(' '),
      isVoidElement: optionData.voidElement,
      isJSX
    })

    let endTag = ''

    if (!optionData.voidElement) {
      endTag = generateTag(optionData.componentName, { isStartTag: false, isJSX })
    }

    return `
${optionData.prefix.join('')}${startTag}${optionData.children.join('')}${endTag}${optionData.suffix.join('')}`
  })

  schemaWithRes.children = schemaWithRes.children.concat(resArr)
}

export const genTemplateByHook = (schema, globalHooks, config) => {
  const parsedSchema = {
    children: [],
    schema: structuredClone({ children: [{ ...schema, componentName: 'div' }] })
  }

  recursiveGenTemplateByHook(parsedSchema, globalHooks, config)

  return `<template>${parsedSchema.children.join('')}</template>`
}
