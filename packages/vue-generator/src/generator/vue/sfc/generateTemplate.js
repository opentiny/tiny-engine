import { BUILTIN_COMPONENT_NAME, BUILTIN_COMPONENT_NAME_MAP, TINY_ICON, INSERT_POSITION } from '@/constant'
import { generateTag } from './generateTag'
import { generateAttribute, mergeDescription } from './generateAttribute'

const recursiveGenTemplate = (children) => {
  const effect = {
    description: {
      hasJSX: false,
      jsResource: { utils: false, bridge: false }
    },
    stateVariable: {}
  }

  const schemaChildren = children || []

  const resArr = schemaChildren.map((schemaItem) => {
    const { componentName, children } = schemaItem
    const { description, stateVariable, resultStr } = generateAttribute(schemaItem)

    mergeDescription(effect.description, description)
    effect.stateVariable = {
      ...effect.stateVariable,
      ...(stateVariable || {})
    }

    const startTag = generateTag(componentName, { attribute: resultStr })
    const endTag = generateTag(componentName, { isStartTag: false })
    const { description: childDesc, stateVariable: childStateVar, resStr } = recursiveGenTemplate(children)

    mergeDescription(effect.description, childDesc)

    effect.stateVariable = {
      ...effect.stateVariable,
      ...(childStateVar || {})
    }

    return `${startTag}${resStr}${endTag}`
  })

  return {
    ...effect,
    resStr: resArr.join('')
  }
}

export const genTemplate = (schema) => {
  const { description, stateVariable, resStr } = recursiveGenTemplate(schema.children)

  return {
    description,
    stateVariable,
    resStr: `<template>${resStr}</template>`
  }
}

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

  globalHooks.addImport('@opentiny/vue-icon', {
    componentName: iconName,
    exportName: name,
    package: '@opentiny/vue-icon',
    version: '^3.10.0',
    destructuring: true
  })

  // tiny icon 需要调用
  globalHooks.addStatement(INSERT_POSITION.BEFORE_PROPS, `const ${iconName} = ${name}()`)

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

// 处理 templateName
// - 内置 templateName 映射
// - 自定义 templateName 处理
// 处理 attribute
// - 常见 attribute 处理（string、number、boolean）
// - 特殊 attribute 处理
//   - js expression 、js function、 js slot、i18n、js resource、
//   - 自定义 attribute 处理（可以转化成 children、add import、add script statement、）
// 处理 children
// 自定义处理 children 方法（）

// 处理 attribute
// 处理 children

// TODO: 支持物料中自定义出码关联片段

// hooks 如何注入？
// 如何判断 hooks 已处理？、未处理？
// 如何判断该调用哪一个 hooks ?
const recursiveGenTemplateByHook = (schemaWithRes, globalHooks, config = {}) => {
  const schemaChildren = schemaWithRes.children || []
  const { hooks = {} } = config
  // 自定义 hooks
  const { componentName: componentNameHooks, attribute: attributeHooks, children: childrenHooks } = hooks

  const resArr = schemaChildren.map((schemaItem) => {
    if (typeof schemaItem !== 'object' || !schemaItem) {
      return schemaItem || ''
    }

    const { componentName, props } = schemaItem
    const parsedComponentName = {
      componentName,
      voidElement: false,
      schema: schemaItem
    }

    for (const hookItem of componentNameHooks) {
      hookItem(parsedComponentName, globalHooks)
    }

    const parsedAttribute = {
      resArr: [],
      props: structuredClone(props),
      schema: schemaItem
    }

    for (const hookItem of attributeHooks) {
      hookItem(parsedAttribute, globalHooks)
    }

    const parsedChildren = {
      resArr: [],
      schema: schemaItem
    }

    for (const hookItem of [...childrenHooks, recursiveGenTemplateByHook]) {
      hookItem(parsedChildren, globalHooks, config)
    }

    const startTag = generateTag(parsedComponentName.componentName, {
      attribute: parsedAttribute.join(' '),
      isVoidElement: parsedComponentName.voidElement
    })

    let endTag = ''

    if (!parsedComponentName.voidElement) {
      endTag = generateTag(parsedComponentName.componentName, { isStartTag: false })
    }

    return `${startTag}${parsedChildren.join('')}${endTag}`
  })

  schemaWithRes.resArr = schemaWithRes.resArr.concat(resArr)
}

export const genTemplateByHook = (schema, globalHooks, config) => {
  const parsedSchema = {
    resArr: [],
    schema: structuredClone(schema)
  }

  recursiveGenTemplateByHook(parsedSchema, globalHooks, config)

  return `<template>${parsedSchema.join('')}</template>`
}
