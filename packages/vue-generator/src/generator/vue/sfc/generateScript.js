import { capitalize } from '@vue/shared'
import { toEventKey, isGetter, isSetter } from '@/utils'
import { generateImportByPkgName } from '@/utils/generateImportStatement'
import { INSERT_POSITION } from '@/constant'
import { transformObjType } from './generateAttribute'
import { hasJsx } from '@/utils/hasJsx'

export const defaultGenImportHook = (schema, globalHooks) => {
  const dependenciesMap = globalHooks.getImport() || {}

  return Object.entries(dependenciesMap)
    .map(([key, value]) => {
      return generateImportByPkgName({ pkgName: key, imports: value }) || ''
    })
    .join('\n')
}

export const defaultGenPropsHook = (schema) => {
  const propsArr = []
  const properties = schema?.schema?.properties || []

  properties.forEach(({ content = [] }) => {
    content.forEach(({ property, type, defaultValue }) => {
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
    })
  })

  return `const props = defineProps({ ${propsArr.join(',')} })\n`
}

export const defaultGenEmitsHook = (schema) => {
  const emitArr = schema?.schema?.events || {}
  const renderArr = Object.keys(emitArr).map(toEventKey)

  return `const emit = defineEmits(${JSON.stringify(renderArr)})`
}

export const defaultGenStateHook = (schema, globalHooks) => {
  const reactiveStatement = `const state = vue.reactive({${Object.values(globalHooks.getState()).join(',')}})`

  return reactiveStatement
}

export const defaultGenMethodHook = (schema, globalHooks) => {
  const methods = globalHooks.getMethods() || {}
  const methodsArr = Object.entries(methods).map(([key, item]) => `const ${key} = wrap(${item.value})`)
  const methodsNames = Object.keys(methods)
  const wrapMethods = methodsNames.length ? `wrap({ ${methodsNames.join(',')} })` : ''

  return `${methodsArr.join('\n')}\n\n${wrapMethods}`
}

export const defaultGenLifecycleHook = (schema) => {
  const { setup: setupFunc, ...restLifeCycle } = schema?.lifeCycles || {}

  let setupRes = ''

  if (setupFunc) {
    const setupStatement = `const setup = wrap(${setupFunc.value})`
    const setupExecution = 'setup({ props, context: { emit }, state, ...vue })'

    setupRes = `${setupStatement}\n${setupExecution}`
  }

  const restLifeCycleRes = Object.entries(restLifeCycle).map(([key, item]) => `vue.${key}(wrap(${item.value}))`)

  return `${setupRes}\n${restLifeCycleRes.join('\n')}`
}

export const parsePropsHook = (schema, globalHooks) => {
  const properties = schema?.schema?.properties || []

  properties.forEach(({ content = [] }) => {
    content.forEach(({ accessor } = {}) => {
      if (isGetter(accessor)) {
        globalHooks.addStatement({
          position: INSERT_POSITION.AFTER_METHODS,
          value: `vue.watchEffect(wrap(${accessor.getter?.value ?? ''}))`
        })
      }

      if (isSetter(accessor)) {
        globalHooks.addStatement({
          position: INSERT_POSITION.AFTER_METHODS,
          value: `vue.watchEffect(wrap(${accessor.setter?.value ?? ''}))`
        })
      }
    })
  })
}

export const parseReactiveStateHook = (schema, globalHooks, config) => {
  const { res } = transformObjType(schema.state, globalHooks, config)

  globalHooks.addState('$$innerState', `${res.slice(1, -1)}`)
}

export const handleProvideStatesContextHook = (schema, globalHooks) => {
  globalHooks.addStatement({
    position: INSERT_POSITION.AFTER_STATE,
    value: `wrap({ state })`
  })
}

export const handleContextInjectHook = (schema, globalHooks) => {
  const injectLowcode = 'const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()'
  const injectLowcodeWrap = 'const wrap = lowcodeWrap(props, { emit })'
  const wrapStoresStatement = `wrap({ stores })`

  globalHooks.addStatement({
    key: 'tiny-engine-inject-statement',
    position: INSERT_POSITION.AFTER_EMIT,
    value: `${injectLowcode}\n${injectLowcodeWrap}\n${wrapStoresStatement}`
  })
}

export const addDefaultVueImport = (schema, globalHooks) => {
  globalHooks.addImport('vue', {
    destructuring: false,
    exportName: '*',
    componentName: 'vue'
  })

  globalHooks.addImport('vue', {
    destructuring: true,
    exportName: 'defineProps',
    componentName: 'defineProps'
  })

  globalHooks.addImport('vue', {
    destructuring: true,
    exportName: 'defineEmits',
    componentName: 'defineEmits'
  })
}

export const addDefaultVueI18nImport = (schema, globalHooks) => {
  globalHooks.addImport('vue-i18n', {
    destructuring: true,
    exportName: 'I18nInjectionKey',
    componentName: 'I18nInjectionKey'
  })
}

export const GEN_SCRIPT_HOOKS = {
  GEN_IMPORT: 'GEN_IMPORT',
  GEN_PROPS: 'GEN_PROPS',
  GEN_EMIT: 'GEN_EMIT',
  GEN_STATE: 'GEN_STATE',
  GEN_METHOD: 'GEN_METHOD',
  GEN_LIFECYCLE: 'GEN_LIFECYCLE'
}

export const genScriptByHook = (schema, globalHooks, config) => {
  const hooks = config.hooks || {}
  const { parseScript = [], genScript = {} } = hooks

  for (const parseHook of parseScript) {
    parseHook(schema, globalHooks, config)
  }

  const {
    AFTER_IMPORT,
    BEFORE_PROPS,
    AFTER_PROPS,
    BEFORE_STATE,
    AFTER_STATE,
    BEFORE_METHODS,
    AFTER_METHODS,
    BEFORE_EMIT,
    AFTER_EMIT
  } = INSERT_POSITION

  const statementGroupByPosition = {
    [AFTER_IMPORT]: [],
    [BEFORE_PROPS]: [],
    [AFTER_PROPS]: [],
    [BEFORE_EMIT]: [],
    [AFTER_EMIT]: [],
    [BEFORE_STATE]: [],
    [AFTER_STATE]: [],
    [BEFORE_METHODS]: [],
    [AFTER_METHODS]: []
  }

  const statements = globalHooks.getStatements() || {}

  Object.values(statements).forEach((statement) => {
    if (statementGroupByPosition[statement.position]) {
      statementGroupByPosition[statement.position].push(statement?.value)

      return
    }

    statementGroupByPosition[AFTER_METHODS].push(statement?.value)
  })

  const importStr = genScript[GEN_SCRIPT_HOOKS.GEN_IMPORT]?.(schema, globalHooks, config) || ''
  const propsStr = genScript[GEN_SCRIPT_HOOKS.GEN_PROPS]?.(schema, globalHooks, config) || ''
  const emitStr = genScript[GEN_SCRIPT_HOOKS.GEN_EMIT]?.(schema, globalHooks, config) || ''
  const stateStr = genScript[GEN_SCRIPT_HOOKS.GEN_STATE]?.(schema, globalHooks, config) || ''
  const methodStr = genScript[GEN_SCRIPT_HOOKS.GEN_METHOD]?.(schema, globalHooks, config) || ''
  const lifeCycleStr = genScript[GEN_SCRIPT_HOOKS.GEN_LIFECYCLE]?.(schema, globalHooks, config) || ''

  const scriptConfig = globalHooks.getScriptConfig()

  let scriptTag = '<script'

  if (scriptConfig.setup) {
    scriptTag = `${scriptTag} setup`
  }

  if (scriptConfig.lang) {
    scriptTag = `${scriptTag} lang="${scriptConfig.lang}"`
  }

  const content = `
${statementGroupByPosition[AFTER_IMPORT].join('\n')}
${statementGroupByPosition[BEFORE_PROPS].join('\n')}
${propsStr}
${statementGroupByPosition[AFTER_PROPS].join('\n')}

${statementGroupByPosition[BEFORE_EMIT].join('\n')}
${emitStr}
${statementGroupByPosition[AFTER_EMIT].join('\n')}

${statementGroupByPosition[BEFORE_STATE].join('\n')}
${stateStr}
${statementGroupByPosition[AFTER_STATE].join('\n')}

${statementGroupByPosition[BEFORE_METHODS].join('\n')}
${methodStr}
${statementGroupByPosition[AFTER_METHODS].join('\n')}

${lifeCycleStr}`

  // 检测当前 script 内容是否有 jsx，如果有且未配置lang，则需要自动加上 jsx 的配置
  const isHasJsx = hasJsx(content)

  if (!scriptConfig.lang && isHasJsx) {
    scriptTag = `${scriptTag} lang="jsx"`
  }

  scriptTag = `${scriptTag}>`

  return `
${scriptTag}
${importStr}

${content}
</script>`
}
