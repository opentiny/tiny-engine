import { capitalize } from '@vue/shared'
import { toEventKey, hasAccessor } from '@/utils'
import { generateImportByPkgName } from '@/utils/generateImportStatement'
import { INSERT_POSITION } from '@/constant'
// import { genCompImport } from './parseImport'
import { transformObjType } from './generateAttribute'

// const generateImports = (schema, config = {}) => {
//   const { defaultImports = [], componentsMap = [] } = config
//   // 组件 import
//   const compImportStr = genCompImport(schema, componentsMap)

//   return `${[...defaultImports, ...compImportStr].join('\n')}`
// }

// export const generateSetupScript = (schema, config) => {
//   // generate import statement
//   // props 声明
//   // emits 声明
//   // resource 工具类绑定
//   // reactive State 页面变量绑定声明
//   // js 方法声明绑定
//   // 生命周期绑定

//   const lang = ''
//   const scriptStart = `<script setup ${lang}>`
//   const endScript = '</script>'
//   const defaultImports = [
//     'import * as vue from "vue"',
//     'import { defineProps, defineEmits } from "vue"',
//     'import { I18nInjectionKey } from "vue-i18n"'
//   ]
//   const compImportStr = generateImports(schema)
//   const importStr = `${defaultImports.join('\n')}\n${compImportStr}`
// }

export const defaultGenImportHook = (dependenciesMap = {}) => {
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
  const reactiveStatement = `const state = vue.reactive(${JSON.stringify(globalHooks.getState() || {}, null, 2)})`

  return reactiveStatement
}

export const defaultGenMethodHook = (schema, globalHooks) => {
  const methods = globalHooks.getMethods() || {}

  // TODO: 判断 methods 中是否有 jsx
  const methodsArr = Object.entries(methods).map(([key, item]) => `const ${key} = wrap(${item.value})`)
  const methodsName = Object.keys(methods)

  return `${methodsArr.join('\n')}\nwrap({ ${methodsName.join(',')} })`
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

  return `${setupRes}${restLifeCycleRes.join('\n')}`
}

export const parsePropsHook = (schema, globalHooks) => {
  const properties = schema?.schema?.properties || []

  properties.forEach(({ content = [] }) => {
    content.forEach(({ accessor } = {}) => {
      if (hasAccessor(accessor)) {
        globalHooks.addStatement({
          position: INSERT_POSITION.AFTER_METHODS,
          value: accessor.getter?.value || accessor.setter?.value
        })
      }
    })
  })
}

export const parseReactiveStateHook = (schema, globalHooks, config) => {
  const { res } = transformObjType(globalHooks.getState() || {}, globalHooks, config)

  globalHooks.setState(res || {})
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
    position: INSERT_POSITION.AFTER_PROPS,
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

  const { AFTER_IMPORT, BEFORE_PROPS, AFTER_PROPS, BEFORE_STATE, AFTER_STATE, BEFORE_METHODS, AFTER_METHODS } =
    INSERT_POSITION

  const statementGroupByPosition = {
    [AFTER_IMPORT]: [],
    [BEFORE_PROPS]: [],
    [AFTER_PROPS]: [],
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

  // TODO: statement generate
  const importStr = genScript[GEN_SCRIPT_HOOKS.GEN_IMPORT]?.() || ''
  const propsStr = genScript[GEN_SCRIPT_HOOKS.GEN_PROPS]?.() || ''
  const emitStr = genScript[GEN_SCRIPT_HOOKS.GEN_EMIT]?.() || ''
  const stateStr = genScript[GEN_SCRIPT_HOOKS.GEN_STATE]?.() || ''
  const methodStr = genScript[GEN_SCRIPT_HOOKS.GEN_METHOD]?.() || ''
  const lifeCycleStr = genScript[GEN_SCRIPT_HOOKS.GEN_LIFECYCLE]?.() || ''

  const scriptConfig = globalHooks.getScriptConfig()

  let scriptTag = '<script'

  if (scriptConfig.setup) {
    scriptTag = `${scriptTag} setup`
  }

  if (scriptConfig.lang) {
    scriptTag = `${scriptTag} lang=${scriptConfig.lang}`
  }

  return `
${scriptTag}
${importStr}
${statementGroupByPosition[AFTER_IMPORT].join('\n')}
${statementGroupByPosition[BEFORE_PROPS].join('\n')}
${propsStr}
${statementGroupByPosition[AFTER_PROPS].join('\n')}
${emitStr}
${statementGroupByPosition[BEFORE_STATE].join('\n')}
${stateStr}
${statementGroupByPosition[AFTER_STATE].join('\n')}
${statementGroupByPosition[BEFORE_METHODS].join('\n')}
${methodStr}
${statementGroupByPosition[AFTER_METHODS].join('\n')}
${lifeCycleStr}
</script>
`
}
