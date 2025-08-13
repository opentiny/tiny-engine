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

import {
  getTypeOfSchema,
  avoidDuplicateString,
  toPascalCase,
  prettierOpts,
  isOn,
  addAccessorRecord,
  addIconRecord,
  handleIconInProps,
  getFunctionInfo,
  formatCode
} from '../utils'
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

// 工具函数：清理状态引用
const cleanStateReference = (value, isClassComponent = false) => {
  if (isClassComponent) {
    return value
      .replace(/this\.state\.(\w+)/g, 'this.state.$1')
      .replace(/this\.props\.(\w+)/g, 'this.props.$1')
      .replace(/this\.(\w+)/g, 'this.$1')
  } else {
    return value
      .replace(/this\.state\.(\w+)/g, 'state.$1')
      .replace(/state\.(\w+)/g, 'state.$1')
      .replace(/this\.props\.(\w+)/g, 'props.$1')
      .replace(/this\.(\w+)/g, '$1')
  }
}

// 工具函数：生成状态更新逻辑
const generateUpdateLogic = (path, isClassComponent = false, isCheckbox = false, componentName = '') => {
  const pathParts = path.split('.')
  
  // 根据组件类型确定如何获取值
  let valueAccess
  
  // 定义直接传递值的组件列表
  const directValueComponents = [
    'Select'
  ]
  
  if (isCheckbox) {
    valueAccess = 'e.target.checked'
  } else if (directValueComponents.some(comp => componentName === comp || componentName.startsWith(comp))) {
    // 这些组件的 onChange 直接传递选中的值
    valueAccess = 'e'
  } else {
    // 其他组件使用 e.target.value
    valueAccess = 'e.target.value'
  }
  
  if (pathParts.length === 1) {
    if (isClassComponent) {
      return `this.setState({ ${path}: ${valueAccess} })`
    } else {
      return `setState(prev => ({ ...prev, ${path}: ${valueAccess} }))`
    }
  } else {
    const parentPath = pathParts.slice(0, -1).join('.')
    const lastPart = pathParts[pathParts.length - 1]
    
    if (isClassComponent) {
      return `this.setState(prev => ({ ...prev, ${parentPath}: { ...prev.${parentPath}, ${lastPart}: ${valueAccess} } }))`
    } else {
      return `setState(prev => ({ ...prev, ${parentPath}: { ...prev.${parentPath}, ${lastPart}: ${valueAccess} } }))`
    }
  }
}

// 工具函数：处理JSX子元素
const recurseJSXChildren = (children, state, description, result, isClassComponent = false) => {
  if (Array.isArray(children)) {
    const subTemplate = children.map((child) => {
      // 如果子元素是 JSExpression 或 JSDataBinding，直接处理
      if (child?.type === 'JSExpression' || child?.type === 'JSDataBinding') {
        const convertedValue = cleanStateReference(child.value, isClassComponent)
        return `{ ${convertedValue} }`
      }
      // 如果子元素是纯文本，直接返回
      if (typeof child === 'string' && child.trim()) {
        return child
      }
      // 否则递归处理
      return generateJSXNode(child, state, description, false, isClassComponent)
    }).join('')
    result.push(subTemplate)
  } else if (children?.type === 'JSExpression' || children?.type === 'JSDataBinding') {
    const convertedValue = cleanStateReference(children.value, isClassComponent)
    result.push(`{ ${convertedValue} }`)
    
    // 记录JS资源使用情况
    Object.keys(description.jsResource).forEach((key) => {
      description.jsResource[key] = description.jsResource[key] || children.value.includes(`.${key}.`)
    })
  } else if (children?.type === 'i18n') {
    result.push(`{ t('${children.key}') }`)
  } else if (typeof children === 'string' && children.trim()) {
    // 处理纯文本内容
    result.push(children)
  } else {
    // 对于空内容或 undefined，不添加任何内容
    if (children && typeof children === 'string' && children.trim()) {
      result.push(children)
    }
  }

  return result
}

// 工具函数：处理事件绑定
const handleJSXEventBinding = (key, item, isClassComponent = false) => {
  if (item?.type !== 'JSExpression') return null
  
  let eventHandler = item.value
  
  // 对于类组件，保留 this. 前缀；对于函数组件，移除 this. 前缀
  if (!isClassComponent) {
    eventHandler = item.value.replace('this.', '')
  }
  
  if (item.params?.length) {
    const extendParams = item.params.join(',')
    return `${key}={(...eventArgs) => ${eventHandler}(eventArgs, ${extendParams})}`
  } else {
    return `${key}={${eventHandler}}`
  }
}

// 工具函数：处理字面量绑定
const handleJSXLiteralBinding = ({ key, item, attrsArr, description, state }) => {
  // 跳过 text 属性，因为它不是有效的 JSX 属性
  if (key === 'text') {
    return
  }

  if (typeof item === 'string') {
    return attrsArr.push(`${key}="${item.replace(/"/g, "'")}"`)
  }

  if (item?.componentName === BUILTIN_COMPONENT_NAME.ICON) {
    const iconName = handleIconInProps(description, item)
    return attrsArr.push(`${key}={${iconName}}`)
  }

  if (typeof item === 'object') {
    traverseState(item, description)
    const canotBind = description.internalTypes.has(JS_FUNCTION) || 
                     description.internalTypes.has(JS_RESOURCE) || 
                     description.internalTypes.has(JS_SLOT)

    if (canotBind) {
      description.internalTypes = new Set()
      const valueKey = avoidDuplicateString(Object.keys(state), key)
      state[valueKey] = item
      return attrsArr.push(`${key}={state.${valueKey}}`)
    }
    
    const parsedValue = unwrapExpression(JSON.stringify(item))
    return attrsArr.push(`${key}={${parsedValue}}`)
  }

  return attrsArr.push(`${key}={${item}}`)
}

// 工具函数：处理数据绑定
const handleJSXDataBinding = ({ key, item, attrsArr, description, state, isClassComponent = false, hasOnChange = false, componentName = '' }) => {
  const cleanedValue = cleanStateReference(item.value, isClassComponent)
  const stateMatch = cleanedValue.match(/state\.(.+)/)
  const statePath = stateMatch ? stateMatch[1] : key

  if (key === 'value' || key === 'modelValue') {
    attrsArr.push(`value={${cleanedValue}}`)
    // 只有在没有显式定义 onChange 时才自动添加
    if (!hasOnChange) {
      attrsArr.push(`onChange={(e) => ${generateUpdateLogic(statePath, isClassComponent, false, componentName)}}`)
    }
  } else if (key === 'checked') {
    attrsArr.push(`checked={${cleanedValue}}`)
    // 只有在没有显式定义 onChange 时才自动添加
    if (!hasOnChange) {
      attrsArr.push(`onChange={(e) => ${generateUpdateLogic(statePath, isClassComponent, true, componentName)}}`)
    }
  } else if (key === 'name') {
    const stateVarName = statePath.split('.')[0]
    attrsArr.push(`name="${stateVarName}"`)
  } else {
    attrsArr.push(`${key}={${cleanedValue}}`)
    
    if (item.model) {
      const modelProp = item.model.prop || 'value'
      const modelEvent = item.model.event || 'onChange'
      
      if (modelProp === 'value') {
        attrsArr.push(`${modelEvent}={(e) => ${generateUpdateLogic(statePath, isClassComponent, false, componentName)}}`)
      } else if (modelProp === 'checked') {
        attrsArr.push(`${modelEvent}={(e) => ${generateUpdateLogic(statePath, isClassComponent, true, componentName)}}`)
      } else {
        attrsArr.push(`${modelEvent}={(value) => setState(prev => ({ ...prev, ${statePath}: value }))}`)
      }
    }
  }

  return attrsArr
}

// 工具函数：处理JSX属性绑定
const handleJSXBinding = (props, attrsArr, description, state, isClassComponent = false, componentName = '') => {
  const processedKeys = new Set()
  
  // 检查是否有显式定义的 onChange
  const hasOnChange = Object.keys(props).some(key => isOn(key) && key === 'onChange')
  
  Object.entries(props).forEach(([key, item]) => {
    const propType = item?.type || 'literal'
    
    if (key === 'dataSource') return attrsArr
    
    if (propType === 'JSDataBinding' || (propType === 'JSExpression' && item.model)) {
      const result = handleJSXDataBinding({key, item, attrsArr, description, state, isClassComponent, hasOnChange, componentName})
      // 标记已处理的键，避免重复处理
      if (key === 'value' || key === 'modelValue') {
        processedKeys.add('onChange')
      }
      return result
    }
    
    if (isOn(key) && !processedKeys.has(key)) {
      const eventBinding = handleJSXEventBinding(key, item, isClassComponent)
      if (eventBinding) {
        return attrsArr.push(eventBinding)
      }
    }

    if (propType === 'literal') {
      return handleJSXLiteralBinding({ key, item, attrsArr, description, state })
    }

    if (propType === 'JSExpression') {
      const convertedValue = cleanStateReference(item.value, isClassComponent)
      return attrsArr.push(`${key}={${convertedValue}}`)
    }

    return attrsArr
  })
}

// 工具函数：生成JSX节点
const generateJSXNode = (schema, state, description, isRootNode = false, isClassComponent = false) => {
  const { componentName, fileName, loop, loopArgs = ['item'], condition, props = {}, children } = schema

  if (componentName === 'Template') return ''
  if (componentName === BUILTIN_COMPONENT_NAME.TEMPLATE && !(children?.length || children?.type)) return ''

  let component = isRootNode ? 'div' : 
                 componentName === BUILTIN_COMPONENT_NAME.BLOCK && fileName ? toPascalCase(fileName) :
                 IntrinsicElements.includes(componentName || 'div') ? componentName || 'div' : 
                 toPascalCase(componentName)

  // 处理带有子组件的组件
  const cmp = AntdComponents.filter((item) => item.subName).find((item) => item.componentName === component)
  if (cmp) {
    // 记录主组件使用
    description.componentSet.add(cmp.exportName)
    // 在JSX中使用正确的组件名称
    component = `${cmp.exportName}.${cmp.subName}`
  }

  if (componentName === BUILTIN_COMPONENT_NAME.BLOCK && fileName) {
    description.blockSet.add(fileName)
  } else {
    description.componentSet.add(componentName)
  }

  const elementWrappers = []
  const jsxResult = []
  const attrsArr = []

  // 处理条件渲染
  if (typeof condition === 'object' || typeof condition === 'boolean') {
    const conditionValue = condition?.type ? condition.value : condition
    const directive = condition?.kind || 'if'

    if (directive === 'if') {
      elementWrappers.push({
        type: 'condition',
        before: `${conditionValue}? `,
        after: `: null`
      })
    }
  }

  // 处理循环渲染
  if (loop) {
    const loopData = cleanStateReference(loop.type ? loop.value : JSON.stringify(loop), isClassComponent)
    elementWrappers.push({
      type: 'loop',
      before: `${loopData}.map((${loopArgs.join(',')}) => `,
      after: `)`
    })
  }

  handleJSXBinding(props, attrsArr, description, state, isClassComponent, component)

  if (elementWrappers.length) {
    jsxResult.push(`{ `)
    elementWrappers.forEach((item) => jsxResult.push(item.before))
  }

  jsxResult.push(`\n<${component} `)
  jsxResult.push(attrsArr.join(' '))

  const VOID_ELEMENTS = ['img', 'input', 'br', 'hr', 'link']
  if (VOID_ELEMENTS.includes(component)) {
    jsxResult.push(' />')
  } else {
    jsxResult.push('>')
    recurseJSXChildren(children, state, description, jsxResult, isClassComponent)
    jsxResult.push(`</${component}>`)
  }

  if (elementWrappers.length) {
    elementWrappers.forEach((item) => jsxResult.push(item.after))
    jsxResult.push(`} `)
  }

  return jsxResult.join('')
}

// 工具函数：生成React导入
const generateReactImports = (description, moduleName, type, componentsMap) => {
  const { blockSet, componentSet } = description
  const imports = []

  imports.push([
    'import React from "react"',
    `import './${moduleName}.css'`
  ].join('\n'))

  // 导入组件
  const componentsInSFC = [...componentSet]
  const componentDeps = componentsMap
    .concat(AntdComponents)
    .filter((item) => componentsInSFC.includes(item.componentName))
  const componentPacks = {}

  componentDeps.forEach((item) => {
    const { package: pkg } = item
    if (!componentPacks[pkg]) componentPacks[pkg] = []

    const { subName, componentName, exportName, ...rest } = item
    if (subName) {
      // 对于有子组件的组件，只导入主组件，不重复导入
      const mainComponentName = exportName || componentName.slice(0, -subName.length)
      if (componentPacks[pkg].every((pkg) => pkg.componentName !== mainComponentName)) {
        componentPacks[pkg].push({ ...rest, componentName: mainComponentName, exportName: mainComponentName })
      }
    } else {
      componentPacks[pkg].push(item)
    }
  })

  Object.entries(componentPacks).forEach(([pkgName, deps]) => {
    // 去重，避免重复导入同一个组件
    const uniqueDeps = deps.reduce((acc, dep) => {
      const { componentName, exportName } = dep
      const key = exportName || componentName
      if (!acc.some(item => (item.exportName || item.componentName) === key)) {
        acc.push(dep)
      }
      return acc
    }, [])

    const items = uniqueDeps.map((dep) => {
      const { componentName, exportName, subName } = dep
      if (TINY_ICON && componentName.startsWith(TINY_ICON)) {
        addIconRecord(description, componentName)
        return exportName
      }
      // 对于有 subName 的组件，使用点号语法（如 Radio.Group）
      if (subName) {
        return `${exportName}.${subName}`
      }
      // 使用 as 语法，将 exportName 导入为 componentName
      // 但是，如果 componentName 包含点号（如 Radio.Group），则直接使用 componentName
      if (exportName && exportName !== componentName && !componentName.includes('.')) {
        return `${exportName} as ${componentName}`
      }
      return exportName || componentName
    })
    imports.push(`import { ${items.join(', ')} } from '${pkgName}'`)
  })

  // 导入区块
  const importBlocks = [...blockSet]
  const blocksName = importBlocks.map((item) => toPascalCase(item))
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
      imports.push(`import ${block} from '${depPath}/${block}'`)
    } else {
      const blockDefaultPath = type === 'Block' ? 
        `import ${block} from './${block}'` : 
        `import ${block} from '../components/${block}'`
      imports.push(blockDefaultPath)
    }
  })

  return { imports }
}

// 工具函数：生成React代码
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

  // 处理属性
  const propsArr = []
  const propsAccessor = []
  properties.forEach(({ content = [] }) => {
    content.forEach(({ property, type, defaultValue, accessor }) => {
      let propType = toPascalCase(type)
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

  // 处理状态
  traverseState(state, description)
  const statementMap = translateHookState(state)
  const stateVars = Array.from(statementMap).map(([key, value]) => {
    let unwrappedValue = unwrapExpression(JSON.stringify(value))
    unwrappedValue = unwrappedValue.replace(/this\.props\.(\w+)/g, 'props.$1')
    return `${key}: ${unwrappedValue}`
  })

  const statement = `const [state, setState] = React.useState({
    ${stateVars.join(',\n    ')}
  })`

  // 处理getters
  const getterStatements = description.getters
    .map((getter) => {
      const { body } = getFunctionInfo(getter.accessor.getter.value)
      const convertedBody = body
        .replace(/this\.state\.(\w+)/g, '$1')
        .replace(/\r?\n/g, '')
        .trim()

      return `  const ${getter.name} = React.useMemo(() => {
    try {
      ${convertedBody}
    } catch (error) {
      return ${JSON.stringify(getter.defaultValue)}
    }
  }, [${statementMap.has('inputValue') ? 'inputValue' : ''}])`
    })
    .join('\n')

  // 处理方法
  const arrowMethods = Object.entries(methods)
    .map(([key, item]) => ({ key, ...getFunctionInfo(item.value) }))
    .filter(({ body }) => Boolean(body))
    .map(({ key, type, params, body }) => {
      const convertedBody = body
        .replace(/this\.setState\(\s*\{\s*(\w+):\s*([^}]+)\s*\}\s*\)/g, (match, stateName, value) => {
          const setterName = `set${stateName.charAt(0).toUpperCase()}${stateName.slice(1)}`
          return `${setterName}(${value})`
        })
        .replace(/this\.utils/g, 'utils')
        .replace(/this\.emit\(/g, '/* emit not supported in function components */ console.log(')

      return `  const ${key} = ${type} (${params.join(',')}) => { ${convertedBody} }`
    })

  // 处理生命周期
  const lifecycleMap = Object.entries(lifeCycles)
    .filter(([, item]) => item?.value)
    .reduce((acc, [key, item]) => {
      acc[key] = item
      return acc
    }, {})

  const hasLifecycleMethods = Object.keys(lifecycleMap).length > 0
  const jsxNode = generateJSXNode(schema, state, description, true, hasLifecycleMethods)

  // 工具函数：提取函数体
  const extractFunctionBody = (functionStr) => {
    const match = functionStr.match(/function\s+\w+\s*\([^)]*\)\s*\{([^}]*)\}/)
    return match ? match[1].trim() : ''
  }

  // 工具函数：转换为类方法
  const convertToClassMethod = (functionStr) => {
    const match = functionStr.match(/^function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*)\}$/)
    if (match) {
      const [, methodName, params, body] = match
      return `  ${methodName}(${params}) {\n    ${body.trim()}\n  }`
    }
    return functionStr
  }

  // 生成hooks
  const hooks = {
    useEffect: lifecycleMap.componentDidMount?.value || lifecycleMap.componentWillUnmount?.value ? `
      React.useEffect(() => {
        ${lifecycleMap.componentDidMount?.value ? extractFunctionBody(lifecycleMap.componentDidMount.value) : ''}
        ${lifecycleMap.componentWillUnmount?.value ? `return () => {${extractFunctionBody(lifecycleMap.componentWillUnmount.value)}}` : ''}
        }, [])
    ` : '',
    useLayoutEffect: lifecycleMap.componentWillMount?.value ? `
         React.useLayoutEffect(() => {
        ${extractFunctionBody(lifecycleMap.componentWillMount.value)}
        }, [])
  ` : '',
    useMemo: lifecycleMap.shouldComponentUpdate?.value ? `
    React.useMemo(() => {
      ${extractFunctionBody(lifecycleMap.shouldComponentUpdate.value)}
      }, [])
  ` : ''
  }

  // 生成类组件的生命周期方法
  const lifecycleMethods = Object.values(lifecycleMap)
    .map(item => convertToClassMethod(item.value))

  // 生成类组件的方法
  const classMethods = Object.entries(methods)
    .map(([key, item]) => ({ key, ...getFunctionInfo(item.value) }))
    .filter(({ body }) => Boolean(body))
    .map(({ key, type, params, body }) => {
      const convertedBody = body
        .replace(/this\.setState\(\s*\{\s*(\w+):\s*([^}]+)\s*\}\s*\)/g, (match, stateName, value) => {
          return `this.setState({ ${stateName}: ${value} })`
        })
        .replace(/this\.utils/g, 'this.utils')
        .replace(/this\.emit\(/g, '/* emit not supported in class components */ console.log(')

      return `  ${key} = ${type} (${params.join(',')}) => { ${convertedBody} }`
    })

  const { imports } = generateReactImports(description, name, type, componentsMap)
  const componentName = capitalizeFirstLetter(name)

  // 添加必要的导入
  const additionalImports = []
  if (jsxNode.match(/\bt\(/)) {
    additionalImports.push("import { useTranslation } from 'react-i18next'")
  }

  // 生成模板
  if (hasLifecycleMethods) {
    return `${imports.join('\n')}
${additionalImports.length > 0 ? additionalImports.join('\n') + '\n' : ''}

class ${componentName} extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ${stateVars.join(',\n      ')}
    }
  }

${lifecycleMethods.join('\n\n')}

${classMethods.join('\n\n')}

  render() {
    const { state } = this
    const utils = {}
    
    return (
      <>
        ${jsxNode}
      </>
    )
  }
}

export default ${componentName}
`
  } else {
    return `${imports.join('\n')}
${additionalImports.length > 0 ? additionalImports.join('\n') + '\n' : ''}

const ${componentName} = (props = {}) => {
${statement}
${getterStatements}

const utils = {}
    
${jsxNode.match(/\bt\(/) ? 'const { t } = useTranslation()' : ''}
  
${Object.values(hooks).filter(Boolean).join('\n')}
  
${arrowMethods.join('\n')}
  
    return (
      <>
        ${jsxNode}
      </>
    )
  }

  export default ${componentName}
`
  }
}

// 工具函数：获取文件路径
const getFilePath = (type = 'page', name = '', componentsMap) => {
  const blocksPathMap = componentsMap
    .filter((item) => !item.package && typeof item.main === 'string')
    .reduce((acc, { componentName: block, main: path }) => ({ ...acc, [block]: path }), {})

  const path = blocksPathMap[name]
  const defaultPathMap = { Block: 'components', Page: 'views' }

  return path ? path : defaultPathMap[type] || name
}

// 主函数：生成页面代码
const generatePageCode = ({ pageInfo, componentsMap, isEntry = true }) => {
  const { schema: originSchema, name } = pageInfo
  const schema = JSON.parse(JSON.stringify(originSchema))
  preProcess(schema)

  const type = getTypeOfSchema(schema)
  const reactCode = generateReactCode({ schema, name, type, componentsMap })

  const formattedReactCode = formatCode(reactCode, `${name}.jsx`)
  const formattedCssCode = formatCode(schema.css || '', `${name}.css`)

  const panels = [
    {
      panelName: `${name}.jsx`,
      panelValue: formattedReactCode,
      panelType: 'react',
      prettierOpts: prettierOpts.js,
      type,
      index: isEntry,
      filePath: getFilePath(type, name, componentsMap)
    },
    {
      panelName: `${name}.css`,
      panelValue: formattedCssCode,
      panelType: 'css',
      prettierOpts: prettierOpts.css,
      type,
      filePath: getFilePath(type, name, componentsMap)
    }
  ]

  return panels.map((panel) => {
    const { panelType } = panel
    let errors = []

    if (panelType === 'vue') {
      // errors = validateByParse(panelValue)
      // if (!errors.length) {
      //   errors = validateByCompile(panelName, panelValue)
      // }
    }

    return { ...panel, errors }
  })
}

// 主函数：生成区块代码
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

// 主函数：生成代码
const generateCode = ({ pageInfo, componentsMap = [], blocksData = [] }) => {
  const validComponents = componentsMap.filter(
    ({ componentName, package: pkg, main }) => componentName && (pkg || typeof main === 'string')
  )
  const allComponents = [...validComponents, ...DEFAULT_COMPONENTS_MAP, ...BUILTIN_COMPONENTS_MAP]

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