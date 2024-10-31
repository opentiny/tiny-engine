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

import { capitalize } from '@vue/shared'
import {
  getTypeOfSchema,
  avoidDuplicateString,
  toPascalCase,
  prettierOpts,
  isOn,
  addAccessorRecord,
  addIconRecord,
  handleIconInProps,
  getFunctionInfo
} from '../utils'
// import { validateByParse, validateByCompile } from '../utils/vue-sfc-validator'
import { traverse as traverseState, unwrapExpression, translateHookState } from '../parser/state'
import { capitalizeFirstLetter } from '../utils/uaperCase'
import { preProcess } from '../pre-processor'
import {
  DEFAULT_COMPONENTS_MAP,
  BUILTIN_COMPONENT_NAME,
  JS_FUNCTION,
  JS_RESOURCE,
  JS_SLOT,
  TINY_ICON,
  BUILTIN_COMPONENTS_MAP,
  IntrinsicElements,
  AntdComponents
} from '../constant'

function recurseJSXChildren(children, state, description, result) {
  if (Array.isArray(children)) {
    const subTemplate = children.map((child) => generateJSXNode(child, state, description)).join('')
    result.push(subTemplate)
  } else if (children?.type === 'JSExpression') {
    result.push(`{ ${children.value} }`)

    Object.keys(description.jsResource).forEach((key) => {
      description.jsResource[key] = description.jsResource[key] || children.value.includes(`.${key}.`)
    })
  } else if (children?.type === 'i18n') {
    result.push(`{ t('${children.key}') }`)
  } else {
    result.push(children || '')
  }

  return result
}

const isEmptySlot = (componentName, children) =>
  componentName === BUILTIN_COMPONENT_NAME.TEMPLATE && !(children?.length || children?.type)

const handleJSXEventBinding = (key, item) => {
  let eventBinding = ''

  // vue 事件绑定，仅支持：内联事件处理器 or 方法事件处理器（绑定方法名或对某个方法的调用）
  if (item?.type === 'JSExpression') {
    const eventHandler = item.value.replace('this.', '') // 强制 replace 一下

    // Vue Template 中，为事件处理函数传递额外的参数时，需要使用内联箭头函数
    if (item.params?.length) {
      const extendParams = item.params.join(',')
      eventBinding = `${key}={(...eventArgs) => ${eventHandler}(eventArgs, ${extendParams})}`
    } else {
      eventBinding = `${key}={${eventHandler}}`
    }
  }

  return eventBinding
}

const handleJSXLiteralBinding = ({ key, item, attrsArr, description, state }) => {
  // 字面量
  // string 直接静态绑定
  if (typeof item === 'string') return attrsArr.push(`${key}="${item.replace(/"/g, "'")}"`)

  if (item?.componentName === BUILTIN_COMPONENT_NAME.ICON) {
    const iconName = handleIconInProps(description, item)

    return attrsArr.push(`${key}={${iconName}}`)
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

      return attrsArr.push(`${key}={this.state.${valueKey}}`)
    }
    const parsedValue = unwrapExpression(JSON.stringify(item))

    return attrsArr.push(`${key}={${parsedValue}}`)
  }

  return attrsArr.push(`${key}={${item}}`)
}

function handleJSXBinding(props, attrsArr, description, state) {
  Object.entries(props).forEach(([key, item]) => {
    const propType = item?.type || 'literal'

    // 事件名，协议约定以 on 开头的 camelCase 形式，template 中使用 kebab-case 形式
    if (isOn(key)) {
      const eventBinding = handleJSXEventBinding(key, item)

      return attrsArr.push(eventBinding)
    }

    if (propType === 'literal') {
      return handleJSXLiteralBinding({ key, item, attrsArr, description, state })
    }

    if (propType === 'JSExpression') {
      return attrsArr.push(`${key}={${item.value}}`)
    }

    return attrsArr
  })
}

function generateJSXNode(schema, state, description, isRootNode = false) {
  const elementWrappers = []
  const jsxResult = []
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
    component = capitalize(fileName)
    description.blockSet.add(fileName)
  } else {
    component = IntrinsicElements.includes(componentName || 'div') ? componentName || 'div' : capitalize(componentName)

    description.componentSet.add(componentName)
  }

  const cmp = AntdComponents.filter((item) => item.subName).find((item) => item.componentName === component)
  if (cmp) {
    component = [component.slice(0, -cmp.subName.length), cmp.subName].join('.')
  }

  const attrsArr = []

  // 处理 condition, 条件渲染
  if (typeof condition === 'object' || typeof condition === 'boolean') {
    const conditionValue = condition?.type ? condition.value : condition
    const directive = condition?.kind || 'if'

    // jsx目前只处理if的情况
    if (directive === 'if') {
      elementWrappers.push({
        type: 'condition',
        before: `${conditionValue}? `,
        after: `: null`
      })
    }
  }

  // 循环渲染 v-for, 循环数据支持：变量表达式、数组/对象字面量
  if (loop) {
    const loopData = (loop.type ? loop.value : JSON.stringify(loop)).replace('this.state.', '') // 改写类语法

    elementWrappers.push({
      type: 'loop',
      before: `${loopData}.map((${loopArgs.join(',')}) => `,
      after: `)`
    })
  }

  handleJSXBinding(props, attrsArr, description, state)

  if (elementWrappers.length) {
    jsxResult.push(`{ `)
    elementWrappers.forEach((item) => {
      jsxResult.push(item.before)
    })
  }

  jsxResult.push(`\n<${component} `)
  jsxResult.push(attrsArr.join(' '))

  // 处理 Void elements: 使用自闭合标签，如：<img />
  const VOID_ELEMENTS = ['img', 'input', 'br', 'hr', 'link']
  if (VOID_ELEMENTS.includes(component)) {
    jsxResult.push(' />')
  } else {
    jsxResult.push('>')

    recurseJSXChildren(children, state, description, jsxResult)

    jsxResult.push(`</${component}>`)
  }

  if (elementWrappers.length) {
    elementWrappers.forEach((item) => {
      jsxResult.push(item.after)
    })
    jsxResult.push(`} `)
  }

  return jsxResult.join('')
}

const generateReactImports = (description, moduleName, type, componentsMap) => {
  const { blockSet, componentSet } = description
  const imports = []

  const importsFromReact = [
    'import * as React from "react"',
    // 'import * as utils from "../lowcode/utils.js"',
    `import './${moduleName}.css'`
  ]

  imports.push(importsFromReact.join('\n'))

  // import components, support alias import, import from multi packages
  const componentsInSFC = [...componentSet]
  const componentDeps = componentsMap
    .concat(AntdComponents)
    .filter((item) => componentsInSFC.includes(item.componentName))
  const componentPacks = {}

  componentDeps.forEach((item) => {
    const { package: pkg } = item

    if (!componentPacks[pkg]) {
      componentPacks[pkg] = []
    }

    const { subName, componentName, ...rest } = item
    if (subName) {
      const cmpName = componentName.slice(0, -subName.length)

      if (componentPacks[pkg].every((pkg) => pkg.componentName !== cmpName)) {
        componentPacks[pkg].push({ ...rest, componentName: cmpName })
      }
    } else {
      componentPacks[pkg].push(item)
    }
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

      blocks.push(`import ${block} from '${depPath}/${block}'`)
    } else {
      const blockDefaultPath =
        type === 'Block' ? `import ${block} from './${block}'` : `import ${block} from '../components/${block}'`

      blocks.push(blockDefaultPath)
    }
  })

  imports.push(...blocks)

  return { imports }
}

const generateReactCode = ({ schema, name, type, componentsMap }) => {
  const { schema: { properties = [] } = {}, state = {}, lifeCycles = {}, methods = {} } = schema
  const description = {
    blockSet: new Set(),
    componentSet: new Set(),
    iconComponents: { componentNames: [], exportNames: [] },
    stateAccessor: [],
    getters: [],
    internalTypes: new Set(),
    hasJSX: false,
    jsResource: { utils: false, bridge: false }
  }

  const jsxNode = generateJSXNode(schema, state, description, true)

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

  // 转换 state 中的特殊类型
  traverseState(state, description)

  const statementMap = translateHookState(state)
  let statement = ''
  for (const [key, value] of statementMap) {
    statement += `const [${key}, set${key}] = React.useState(${JSON.stringify(value)}) \n`
  }
  // const stateStatement = `${unwrapExpression(JSON.stringify(state, null, 2))}`

  const getters = description.getters.map((getter) => {
    const { type, params, body } = getFunctionInfo(getter.accessor.getter.value)
    const funcStr = `${type} (${params.join(',')}) => { ${body} }`
    return `get ${getter.name}() {
        return (${funcStr})() || ${JSON.stringify(getter.defaultValue)}
      }`
  })

  const arrowMethods = Object.entries(methods)
    .map(([key, item]) => ({ key, ...getFunctionInfo(item.value) }))
    .filter(({ body }) => Boolean(body))
    .map(({ key, type, params, body }) => `const ${key}=${type} (${params.join(',')}) => { ${body} }`)

  const lifecycle = Object.entries(lifeCycles)
    .map(([key, item]) => ({ key, ...getFunctionInfo(item.value) }))
    .filter(({ body }) => Boolean(body))
    .map(({ key, type, params, body }) => {
      const ans = {}
      ans[key] = {
        body: body,
        type: type,
        params: params
      }
      return ans
    })

  const lifecycleMap = {}
  lifecycle.forEach((item) => {
    const key = Object.keys(item)[0]
    lifecycleMap[key] = item[key]
  })

  const componentDidMount = lifecycleMap['componentDidMount']
  const componentWillUnmount = lifecycleMap['componentWillUnmount']
  const componentDidUpdate = lifecycleMap['componentDidUpdate']

  const componentWillMount = lifecycleMap['componentWillMount']

  const shouldComponentUpdate = lifecycleMap['shouldComponentUpdate']

  const stringUseEffect = `
      React.useEffect(() => {
        ${componentDidMount && componentDidMount['body'] ? componentDidMount['body'] : ''}
        ${componentWillUnmount && componentWillUnmount['body'] ? `return () => {${componentWillUnmount['body']}}` : ''}
        }, [${componentDidUpdate && componentDidUpdate['params'] ? componentDidUpdate['params'] : ''}])
    `

  const stringUseLayoutEffect = `
         React.useLayoutEffect(() => {
        ${componentWillMount && componentWillMount['body'] ? componentWillMount['body'] : ''}
        }, [${componentDidUpdate && componentDidUpdate['params'] ? componentDidUpdate['params'] : ''}])
  `

  const stringUseMemo = `
    React.useMemo(() => {
      ${shouldComponentUpdate && shouldComponentUpdate['body'] ? shouldComponentUpdate['body'] : ''}
      }, [${shouldComponentUpdate && shouldComponentUpdate['params'] ? shouldComponentUpdate['params'] : ''}])
  `
  const { imports } = generateReactImports(description, name, type, componentsMap)

  const componentName = capitalizeFirstLetter(name)
  // 生成模板
  const result = `${imports.join('\n')}

  const ${componentName} = () => {
    ${statement}

    ${getters.join('\n')}

    const utils = {}
  
    ${stringUseEffect}
    ${stringUseLayoutEffect}
    ${stringUseMemo}
  
    ${arrowMethods.join('\n')}
  
    return (
      <>
        ${jsxNode}
      </>
    )
  }

  export default ${componentName}
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
  const reactCode = generateReactCode({ schema, name, type, componentsMap })

  const panels = [
    {
      panelName: `${name}.jsx`,
      panelValue: reactCode,
      panelType: 'react',
      prettierOpts: prettierOpts.js,
      type,
      index: isEntry,
      filePath: getFilePath(type, name, componentsMap)
    },
    {
      panelName: `${name}.css`,
      panelValue: schema.css || '',
      panelType: 'css',
      prettierOpts: prettierOpts.css,
      type,
      filePath: getFilePath(type, name, componentsMap)
    }
  ]

  const result = panels.map((panel) => {
    const {
      // panelName,
      // panelValue,
      panelType
    } = panel
    let errors = []

    if (panelType === 'vue') {
      // errors = validateByParse(panelValue)
      // if (!errors.length) {
      //   errors = validateByCompile(panelName, panelValue)
      // }
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
