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
import { getImportMap } from './parseImport'

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

  // 增加 svg 颜色属性，使编辑模式与出码模式一致
  nameObj.schema.props['fill'] = 'currentColor'

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

const transformSlots = (slots) => {
  if (!slots || typeof slots !== 'object') {
    return []
  }

  const res = Object.entries(slots).map(([key, value]) => {
    return {
      componentName: 'template',
      props: {
        slot: {
          name: key,
          params: value?.params || ''
        }
      },
      children: value?.value
    }
  })

  return res
}

const transformColumnToChildren = (columns) => {
  if (!Array.isArray(columns)) {
    return
  }

  const res = columns.map((item) => {
    const { slots, ...restItem } = item

    let children = []

    if (slots) {
      children = transformSlots(slots)
    }

    return {
      componentName: 'TinyGridColumn',
      props: restItem,
      children
    }
  })

  return res
}

// 检测 tinyGrid 表格列是否有插槽配置
const columnHasSlots = (columns) => {
  for (const columnItem of columns) {
    if (columnItem.slots && typeof columnItem.slots === 'object' && Object.keys(columnItem.slots).length > 0) {
      return true
    }
  }

  return false
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
  })

  const hasSlots = columnHasSlots(props.columns)

  // 存在 slots，将表格列转化成 children 的配置
  if (hasSlots) {
    schemaData.schema.children = schemaData.schema.children || []
    schemaData.schema.children.push(...transformColumnToChildren(props.columns))

    // 解析 slot 中的 依赖
    const { pkgMap = {}, blockPkgMap = {} } = getImportMap(schemaData.schema, config.componentsMap, config)

    Object.entries({ ...pkgMap, ...blockPkgMap }).forEach(([key, value]) => {
      value.forEach((valueItem) => {
        globalHooks.addImport(key, valueItem)
      })
    })

    delete props.columns
  }
}

/**
 * 解决往插槽传参的场景。
 * 比如区块设置了插槽，需要往里面传数据，schema 协议会生成如下参数
 * {
 *   params: [{ name: "test", value: { type: "JSExpression", value: "this.state.arr" } }]
 * }
 * 需要将数组进行解析然后转换，才能进行后续正确出码，
 * @param {*} schemaData
 * @returns
 */
export const handleSlotParams = (schemaData) => {
  const { componentName, props } = schemaData.schema

  if (componentName !== 'Slot' || !Array.isArray(props?.params)) {
    return
  }

  props.params.forEach((paramItem) => {
    const { name, value } = paramItem || {}

    if (name && value) {
      props[name] = value
    }
  })

  delete props.params
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

export const recursiveGenTemplateByHook = (schemaWithRes, globalHooks, config = {}, nextPage) => {
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

    let { componentName, component } = schemaItem

    if (nextPage) {
      componentName = componentName === 'RouterView' ? nextPage : componentName
    }

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
      hookItem(optionData, globalHooks, config, nextPage)
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

export const genTemplateByHook = (schema, globalHooks, config, nextPage) => {
  const parsedSchema = {
    children: [],
    schema: structuredClone({ children: [{ ...schema, componentName: 'div' }] })
  }

  recursiveGenTemplateByHook(parsedSchema, globalHooks, config, nextPage)

  return `<template>${parsedSchema.children.join('')}</template>`
}
