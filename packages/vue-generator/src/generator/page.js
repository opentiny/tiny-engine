/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { capitalize, hyphenate } from '@vue/shared'
import {
  getTypeOfSchema,
  avoidDuplicateString,
  toPascalCase,
  prettierOpts,
  isOn,
  toEventKey,
  addAccessorRecord,
  addIconRecord,
  handleIconInProps
} from '../utils'
import { validateByParse, validateByCompile } from '../utils/vue-sfc-validator'
import { traverse as traverseState, unwrapExpression } from '../parser/state'
import { preProcess } from '../pre-processor'
import {
  DEFAULT_COMPONENTS_MAP,
  BUILTIN_COMPONENT_NAME,
  JS_FUNCTION,
  JS_RESOURCE,
  JS_SLOT,
  TINY_ICON,
  BUILTIN_COMPONENTS_MAP
} from '../constant'

function recurseChildren(children, state, description, result) {
  if (Array.isArray(children)) {
    const subTemplate = children.map((child) => generateTemplate(child, state, description)).join('')
    result.push(subTemplate)
  } else if (children?.type === 'JSExpression') {
    result.push(`{{ ${children.value.replace(/this\.(props\.)?/g, '')} }}`)

    Object.keys(description.jsResource).forEach((key) => {
      description.jsResource[key] = description.jsResource[key] || children.value.includes(`.${key}.`)
    })
  } else if (children?.type === 'i18n') {
    result.push(`{{ t('${children.key}') }}`)
  } else {
    result.push(children || '')
  }

  return result
}

const isEmptySlot = (componentName, children) =>
  componentName === BUILTIN_COMPONENT_NAME.TEMPLATE && !(children?.length || children?.type)

function handleSlotBinding(item) {
  const { name, params } = item
  let slot = `#${name || item}`

  if (Array.isArray(params)) {
    slot = `#${name}="{ ${params.join(',')} }"`
  } else if (typeof params === 'string') {
    slot = `#${name}="${params}"`
  }
  return slot
}

const handleEventBinding = (key, item) => {
  const eventKey = toEventKey(key)
  let eventBinding = ''

  // vue 事件绑定，仅支持：内联事件处理器 or 方法事件处理器（绑定方法名或对某个方法的调用）
  if (item?.type === 'JSExpression') {
    const eventHandler = item.value.replace(/this\.(props\.)?/g, '')

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

const handleLiteralBinding = ({ key, item, attrsArr, description, state }) => {
  // 字面量
  // string 直接静态绑定
  if (typeof item === 'string') return attrsArr.push(`${key}="${item.replace(/"/g, '&quot;')}"`)

  // TODO: 拿到这里的场景 case？
  if (item?.componentName === BUILTIN_COMPONENT_NAME.ICON) {
    const iconName = handleIconInProps(description, item)

    return attrsArr.push(`:${key}="${iconName}"`)
  }

  // 复杂类型（not null），解析协议（如：i18n）后，使用 v-bind 绑定，注意：双引号与单引号的处理
  if (typeof item === 'object') {
    traverseState(item, description)
    const canotBind =
      description.internalTypes.has(JS_FUNCTION) ||
      description.internalTypes.has(JS_RESOURCE) ||
      description.internalTypes.has(JS_SLOT)

    // 不能直接绑定的，新建临时变量，以 state 变量的形式绑定
    if (canotBind) {
      description.internalTypes = new Set()
      const valueKey = avoidDuplicateString(Object.keys(state), key)
      state[valueKey] = item

      return attrsArr.push(`:${key}="state.${valueKey}"`)
    }
    const parsedValue = unwrapExpression(JSON.stringify(item)).replace(/props\./g, '')

    return attrsArr.push(`:${key}="${parsedValue.replace(/"/g, '&quot;')}"`)
  }

  // number/boolean/expression 使用 v-bind 绑定
  return attrsArr.push(`:${key}="${item}"`)
}

function handleBinding(props, attrsArr, description, state) {
  Object.entries(props).forEach(([key, item]) => {
    // 处理 className
    if (key === 'className') {
      key = 'class'
    }

    // 处理 slot
    if (key === 'slot') {
      let slot = handleSlotBinding(item)

      return attrsArr.push(slot)
    }

    const propType = item?.type || 'literal'

    // 事件名，协议约定以 on 开头的 camelCase 形式，template 中使用 kebab-case 形式
    if (isOn(key)) {
      const eventBinding = handleEventBinding(key, item)

      return attrsArr.push(eventBinding)
    }

    if (propType === 'literal') {
      return handleLiteralBinding({ key, item, attrsArr, description, state })
    }

    if (propType === 'JSExpression') {
      // 支持带参数的 v-model
      if (item.model) {
        const modelArgs = item.model?.prop ? `:${item.model.prop}` : ''
        return attrsArr.push(`v-model${modelArgs}="${item.value.replace(/this\.(props\.)?/g, '')}"`)
      }

      // 弥补在recurseChildren方法中，当children为undefined，但是该元素的props存在变量绑定的情况，此变量绑定的为
      // 当前JSResources在props的使用场景为变量绑定，使用范式一般为：this.xxx
      const pickResourceKeys = item.value?.match(/(?<=this\.)\w+/g) || []
      const itemObject = Object.fromEntries(pickResourceKeys.map((key) => [key, true]))

      Object.keys(description.jsResource).forEach((jsResourceKey) => {
        description.jsResource[jsResourceKey] = description.jsResource[jsResourceKey] || itemObject[jsResourceKey]
      })

      // expression 使用 v-bind 绑定
      return attrsArr.push(`:${key}="${item.value.replace(/this\.(props\.)?/g, '')}"`)
    }

    if (propType === 'i18n') {
      const tArguments = [`'${item.key}'`]
      const i18nParams = JSON.stringify(item.params)?.replace(/"/g, "'")

      i18nParams && tArguments.push(i18nParams)

      return attrsArr.push(`:${key}="t(${tArguments.join(',')})"`)
    }

    return attrsArr
  })
}

function generateTemplate(schema, state, description, isRootNode = false) {
  const result = []
  const { componentName, fileName, loop, loopArgs = ['item'], condition, props = {}, children } = schema

  // // 不生成空 div 作为根节点，兼容支持有页面属性的 div 根节点
  // if (isEmptyRoot(isRootNode, props)) {
  //   return recurseChildren(children, description, result)
  // }

  // 不生成空插槽，否则会影响插槽的默认内容
  if (isEmptySlot(componentName, children)) {
    return ''
  }

  let component = ''
  if (isRootNode) {
    component = 'div'
  } else if (componentName === BUILTIN_COMPONENT_NAME.BLOCK && fileName) {
    component = hyphenate(fileName)
    description.blockSet.add(fileName)
  } else {
    component = hyphenate(componentName || 'div')
    description.componentSet.add(componentName)
  }

  result.push(`\n<${component} `)

  const attrsArr = []

  // 循环渲染 v-for, 循环数据支持：变量表达式、数组/对象字面量
  if (loop) {
    const loopData = loop.type
      ? loop.value.replace(/this\.(props\.)?/g, '')
      : JSON.stringify(loop).replace(/"/g, '&quot;')

    attrsArr.push(`v-for="(${loopArgs.join(',')}) in ${loopData}"`)
  }

  // 处理 condition, 条件渲染
  if (typeof condition === 'object' || typeof condition === 'boolean') {
    const conditionValue = condition?.type ? condition.value.replace(/this\.(props\.)?/g, '') : condition
    const directive = condition?.kind || 'if'
    const conditionStr = directive === 'else' ? 'v-else' : `v-${directive}="${conditionValue}"`

    attrsArr.push(conditionStr)
  }

  handleBinding(props, attrsArr, description, state)

  result.push(attrsArr.join(' '))

  // 处理 Void elements: 使用自闭合标签，如：<img />
  const VOID_ELEMENTS = ['img', 'input', 'br', 'hr', 'link']
  if (VOID_ELEMENTS.includes(component)) {
    result.push(' />')
  } else {
    result.push('>')

    recurseChildren(children, state, description, result)

    result.push(`</${component}>`)
  }

  return result.join('')
}

const generateImports = (description, moduleName, type, componentsMap) => {
  const { blockSet, componentSet } = description
  const imports = []

  const importsFromVue = [
    'import * as vue from "vue"',
    'import { defineProps, defineEmits } from "vue"',
    'import { I18nInjectionKey } from "vue-i18n"'
  ]

  imports.push(importsFromVue.join('\n'))

  // import components, support alias import, import from multi packages
  const componentsInSFC = [...componentSet]
  const componentDeps = componentsMap.filter((item) => componentsInSFC.includes(item.componentName))
  const componentPacks = {}

  componentDeps.forEach((item) => {
    const { package: pkg } = item

    if (!componentPacks[pkg]) {
      componentPacks[pkg] = []
    }

    componentPacks[pkg].push(item)
  })

  Object.entries(componentPacks).forEach(([pkgName, deps]) => {
    const items = deps.map((dep) => {
      const { componentName, exportName } = dep

      if (componentName.startsWith(TINY_ICON)) {
        addIconRecord(description, componentName)

        return exportName
      }

      return exportName && exportName !== componentName ? `${exportName} as ${componentName}` : `${componentName}`
    })

    imports.push(`import { ${items.join(',')} } from '${pkgName}'`)
  })

  // import blocks, support PascalCase or kebab-case of blockName
  const importBlocks = [...blockSet]
  const blocksName = importBlocks.map((item) => toPascalCase(item))
  const blocks = []

  const blocksPathMap = componentsMap
    .filter((item) => !item.package && typeof item.main === 'string')
    .reduce((acc, { componentName: block, main: path }) => ({ ...acc, [block]: path }), {})
  const componentNames = componentsMap.map(({ componentName }) => componentName)
  const needImportBlocks = blocksName.filter((name) => componentNames.includes(name))

  needImportBlocks.forEach((block) => {
    const { [moduleName]: fromPath, [block]: toPath } = blocksPathMap

    if (typeof toPath === 'string') {
      let depPath = toPath || '.'

      if (typeof fromPath !== 'string') {
        depPath = toPath || '.'
      } else if (toPath === fromPath) {
        depPath = '.'
      } else {
        const path = require('path')
        const relativePath = path?.relative(fromPath, toPath).replace(/\\/g, '/')
        depPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`
      }

      blocks.push(`import ${block} from '${depPath}/${block}.vue'`)
    } else {
      const blockDefaultPath =
        type === 'Block' ? `import ${block} from './${block}.vue'` : `import ${block} from '../components/${block}.vue'`

      blocks.push(blockDefaultPath)
    }
  })

  imports.push(...blocks)

  return { imports }
}

const generateVueCode = ({ schema, name, type, componentsMap }) => {
  const { css = '', schema: { properties = [], events = {} } = {}, state = {}, lifeCycles = {}, methods = {} } = schema
  const description = {
    blockSet: new Set(),
    componentSet: new Set(),
    iconComponents: { componentNames: [], exportNames: [] },
    stateAccessor: [],
    internalTypes: new Set(),
    hasJSX: false,
    jsResource: { utils: false, bridge: false }
  }

  const template = generateTemplate(schema, state, description, true)

  const propsArr = []
  const propsAccessor = []
  properties.forEach(({ content = [] }) => {
    content.forEach(({ property, type, defaultValue, accessor }) => {
      let propType = capitalize(type)
      let propValue = defaultValue

      if (propType === 'String') {
        propValue = JSON.stringify(defaultValue)
      } else if (['Array', 'Object'].includes(propType)) {
        propValue = `() => (${JSON.stringify(defaultValue)})`
      } else if (propType === 'Function') {
        propValue = defaultValue.value
      }

      propsArr.push(`${property}: { type: ${propType}, default: ${propValue} }`)

      addAccessorRecord(accessor, propsAccessor)
    })
  })

  const emitsArr = Object.keys(events).map(toEventKey)

  // 转换 state 中的特殊类型
  traverseState(state, description)

  const usedResource = Object.keys(description.jsResource).filter((key) => description.jsResource[key])
  const resourceStatement = usedResource.length
    ? `const { ${usedResource.join(',')} } = wrap(function() { return this })()`
    : ''

  const reactiveStatement = `const state = vue.reactive(${unwrapExpression(JSON.stringify(state, null, 2))})`

  const allAccessor = [...propsAccessor, ...description.stateAccessor]
  const accessorStatement = allAccessor.map((func) => `vue.watchEffect(wrap(${func}))`).join('\n')

  const methodsName = Object.keys(methods)
  const methodsArr = Object.entries(methods).map(([key, item]) => `const ${key} = wrap(${item.value})`)

  const { setup, ...restLifecycles } = lifeCycles
  const setupStatement = setup ? `const setup = wrap(${setup.value})` : ''
  const setupExecution = setup ? 'setup({ props, context: { emit }, state, ...vue })' : ''

  const lifecycles = Object.entries(restLifecycles).map(([key, item]) => `vue.${key}(wrap(${item.value}))`)

  const scriptLang = description.hasJSX ? 'lang="jsx"' : ''

  const { imports } = generateImports(description, name, type, componentsMap)
  const { componentNames, exportNames } = description.iconComponents
  const iconStatement = componentNames.length
    ? `const [${componentNames.join(',')}] = [${exportNames.map((name) => `${name}()`).join(',')}]`
    : ''

  const contextArr = ['stores', 'state', ...methodsName]

  const result = `
<template>
  ${template}
</template>

<script setup ${scriptLang}>
${imports.join('\n')}

const props = defineProps({${propsArr.join(',\n')}})
const emit = defineEmits(${JSON.stringify(emitsArr)})

const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })

${iconStatement}

${resourceStatement}

${reactiveStatement}

${methodsArr.join('\n\n')}

wrap({
  ${contextArr.join(',\n')}
})

${accessorStatement}

${setupStatement}
${setupExecution}

${lifecycles.join('\n\n')}
</script>

<style scoped>
  ${css}
</style>
`
  return result
}

const getFilePath = (type = 'page', name = '', componentsMap) => {
  const blocksPathMap = componentsMap
    .filter((item) => !item.package && typeof item.main === 'string')
    .reduce((acc, { componentName: block, main: path }) => ({ ...acc, [block]: path }), {})

  const path = blocksPathMap[name]
  const defaultPathMap = { Block: 'components', Page: 'views' }

  return path ? path : defaultPathMap[type] || name
}

const generatePageCode = ({ pageInfo, componentsMap, isEntry = true }) => {
  const { schema: originSchema, name } = pageInfo

  // 深拷贝，避免副作用改变传入的 schema 值
  const schema = JSON.parse(JSON.stringify(originSchema))
  preProcess(schema)

  const type = getTypeOfSchema(schema)
  const vueCode = generateVueCode({ schema, name, type, componentsMap })

  const panels = [
    {
      panelName: `${name}.vue`,
      panelValue: vueCode,
      panelType: 'vue',
      prettierOpts: prettierOpts.vue,
      type,
      index: isEntry,
      filePath: getFilePath(type, name, componentsMap)
    }
  ]

  const result = panels.map((panel) => {
    const { panelName, panelValue, panelType } = panel
    let errors = []

    if (panelType === 'vue') {
      errors = validateByParse(panelValue)

      if (!errors.length) {
        errors = validateByCompile(panelName, panelValue)
      }
    }

    return { ...panel, errors }
  })

  return result
}

const generateBlocksCode = ({ blocksData, componentsMap }) => {
  const result = {}
  blocksData.forEach((block) => {
    if (!block.label || !block.content) return
    const name = toPascalCase(block.label)
    const pageInfo = { name, schema: block.content }
    const pageCodeResult = generatePageCode({ pageInfo, componentsMap, isEntry: false })
    result[block.label] = pageCodeResult
  })
  return result
}

const generateCode = ({ pageInfo, componentsMap = [], blocksData = [] }) => {
  // 过滤外部传入的无效 componentMap，比如：可能传入 HTML 原生标签 package: ''
  // 注意区分区块 package: undefined, main: string（区块路径 main，空字符串表示当前目录，等价于 './'）
  const validComponents = componentsMap.filter(
    ({ componentName, package: pkg, main }) => componentName && (pkg || typeof main === 'string')
  )
  const allComponents = [...validComponents, ...DEFAULT_COMPONENTS_MAP, ...BUILTIN_COMPONENTS_MAP]

  // 对象数组，去重
  const allComponentsMap = new Map()
  allComponents.forEach(
    (item) => !allComponentsMap.has(item.componentName) && allComponentsMap.set(item.componentName, item)
  )
  const componentDepsPath = [...allComponentsMap.values()]

  const blocksCode = generateBlocksCode({ blocksData, componentsMap: componentDepsPath })
  const pagesCode = generatePageCode({ pageInfo, componentsMap: componentDepsPath })

  return [...pagesCode, ...Object.values(blocksCode).flat()]
}

export { generateCode, generateBlocksCode, generatePageCode }
