import {
  BUILTIN_COMPONENT_NAME,
  BUILTIN_COMPONENT_NAME_MAP,
  TINY_ICON,
  INSERT_POSITION,
  JS_EXPRESSION,
  JS_I18N,
  JS_RESOURCE
} from '@/constant'
import { generateTag, HTML_DEFAULT_VOID_ELEMENTS } from './generateTag'
import { specialTypeHandler } from './generateAttribute'
import { thisPropsBindRe, thisRegexp } from '@/utils'

export const handleComponentNameHook = (optionData) => {
  const { componentName, schema } = optionData

  // 内置 component
  if (!BUILTIN_COMPONENT_NAME_MAP[componentName]) {
    return
  }

  if (componentName === BUILTIN_COMPONENT_NAME.TEXT && schema.props.text) {
    schema.children = schema.props.text
    delete schema.props.text
  }

  optionData.componentName = BUILTIN_COMPONENT_NAME_MAP[componentName]

  if (HTML_DEFAULT_VOID_ELEMENTS.includes(optionData.componentName)) {
    optionData.voidElement = true
  }
}

export const handleTinyIcon = (nameObj, globalHooks) => {
  if (BUILTIN_COMPONENT_NAME.ICON !== nameObj.componentName) {
    return
  }

  const name = nameObj.schema.props.name

  if (!name) {
    return
  }

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

const handleTinyGridSlots = (value, globalHooks, config) => {
  if (!Array.isArray(value)) {
    return
  }

  value.forEach((slotItem) => {
    const name = slotItem.componentName

    if (!name) {
      return
    }

    if (slotItem.componentType === 'Block') {
      const importPath = `${config.blockRelativePath}${name}${config.blockSuffix}`

      globalHooks.addImport(importPath, {
        exportName: name,
        componentName: name,
        package: importPath
      })
    } else if (name?.startsWith?.('Tiny')) {
      globalHooks.addImport('@opentiny/vue', {
        destructuring: true,
        exportName: name.slice(4),
        componentName: name,
        package: '@opentiny/vue'
      })
    }

    handleTinyGridSlots(slotItem.children, globalHooks, config)
  })
}

export const handleTinyGrid = (schemaData, globalHooks, config) => {
  const { componentName, props } = schemaData.schema

  // 同时存在 data 和 fetchData 的时候，删除 data
  if (componentName === 'TinyGrid' && props?.data && props?.fetchData) {
    delete props.data
  }

  // 处理 TinyGrid 插槽
  if (componentName !== 'TinyGrid' || !Array.isArray(props?.columns)) {
    return
  }

  // 处理 TinyGrid 组件 editor 插槽组件使用 opentiny/vue 组件的场景，需要在 import 中添加对应Tiny组件的引入
  props.columns.forEach((item) => {
    if (item.editor?.component?.startsWith?.('Tiny')) {
      const name = item.editor?.component

      globalHooks.addImport('@opentiny/vue', {
        destructuring: true,
        exportName: name.slice(4),
        componentName: name,
        package: '@opentiny/vue'
      })

      item.editor.component = {
        type: 'JSExpression',
        value: name
      }
    }

    if (typeof item.slots === 'object') {
      Object.values(item.slots).forEach((slotItem) => handleTinyGridSlots(slotItem?.value, globalHooks, config))
    }
  })
}

export const handleExpressionChildren = (schemaData = {}, globalHooks, config) => {
  const { children, schema } = schemaData
  const type = schema?.children?.type
  const isJSX = config.isJSX
  const prefix = isJSX ? '{' : '{{'
  const suffix = isJSX ? '}' : '}}'

  if (type === JS_EXPRESSION) {
    specialTypeHandler[JS_RESOURCE](schema.children, globalHooks, config)

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
  const { genTemplate: genTemplateHooks, templateItemValidate } = hooks

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

    for (const hookItem of [...genTemplateHooks, recursiveGenTemplateByHook]) {
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
