import { getImportMap } from './parseImport'
import {
  genTemplateByHook,
  handleComponentNameHook,
  handleTinyGrid,
  handleTinyIcon,
  handleExpressionChildren,
  validEmptyTemplateHook
} from './generateTemplate'
import { generateStyleTag } from './generateStyle'
import {
  handleConditionAttrHook,
  handleLoopAttrHook,
  handleSlotBindAttrHook,
  handleAttrKeyHook,
  handlePrimitiveAttributeHook,
  handleExpressionAttrHook,
  handleI18nAttrHook,
  handleObjBindAttrHook,
  handleEventAttrHook,
  handleTinyIconPropsHook
} from './generateAttribute'
import {
  GEN_SCRIPT_HOOKS,
  genScriptByHook,
  parsePropsHook,
  parseReactiveStateHook,
  addDefaultVueImport,
  addDefaultVueI18nImport,
  handleProvideStatesContextHook,
  handleContextInjectHook,
  defaultGenImportHook,
  defaultGenPropsHook,
  defaultGenEmitsHook,
  defaultGenStateHook,
  defaultGenMethodHook,
  defaultGenLifecycleHook
} from './generateScript'

const parseConfig = (config = {}) => {
  const {
    blockRelativePath = '../components/',
    blockSuffix = '.vue',
    scriptConfig = {},
    styleConfig = {}
  } = config || {}
  const res = {
    ...config,
    blockRelativePath,
    blockSuffix,
    scriptConfig,
    styleConfig
  }

  return res
}

const defaultScriptConfig = {
  lang: '',
  setup: true
}

const defaultStyleConfig = {
  scoped: true,
  lang: ''
}

const generateSFCFile = (schema, componentsMap, config = {}) => {
  const parsedConfig = parseConfig(config)
  const { blockRelativePath, blockSuffix, scriptConfig: initScriptConfig, styleConfig: initStyleConfig } = parsedConfig
  // 前置动作，对 Schema 进行解析初始化相关配置与变量
  if (!schema.state) {
    schema.state = {}
  }

  // 解析 import
  const { pkgMap, blockPkgMap } = getImportMap(schema, componentsMap, { blockRelativePath, blockSuffix })

  // 解析 state
  let stateRes = {}

  // 解析 method
  const methods = schema.methods || {}

  // 其他表达式语句
  const statements = {}

  // config
  let scriptConfig = {
    ...defaultScriptConfig,
    ...initScriptConfig
  }

  let styleConfig = {
    ...defaultStyleConfig,
    ...initStyleConfig
  }

  const globalHooks = {
    addStatement: (newStatement) => {
      if (!newStatement?.value) {
        return false
      }

      const key = newStatement.key || newStatement.value

      if (statements[key]) {
        return false
      }

      statements[key] = newStatement

      return true
    },
    getStatements: () => statements,
    addMethods: (key, value) => {
      if (methods[key]) {
        return false
      }

      methods[key] = value

      return true
    },
    getMethods: () => methods,
    addState: (key, value) => {
      if (schema.state[key] || stateRes[key]) {
        return false
      }

      stateRes[key] = value

      return true
    },
    getState: () => stateRes,
    setState: () => {
      // state = newState
    },
    addImport: (fromPath, config) => {
      const dependenciesMap = pkgMap[fromPath] || blockPkgMap[fromPath]

      if (dependenciesMap) {
        // 默认导出
        if (!config.destructuring && dependenciesMap.find(({ destructuring }) => !destructuring)) {
          return false
        }

        const hasExists = dependenciesMap.find(({ destructuring, exportName, componentName }) => {
          return (
            destructuring === config.destructuring &&
            exportName === config.exportName &&
            componentName === config.componentName
          )
        })

        if (hasExists) {
          return false
        }

        dependenciesMap.push(config)

        return true
      }

      pkgMap[fromPath] = [config]

      return true
    },
    getImport: () => ({ ...pkgMap, ...blockPkgMap }),
    setScriptConfig: (newConfig) => {
      if (!newConfig || typeof newConfig !== 'object') {
        return
      }

      scriptConfig = {
        ...scriptConfig,
        ...newConfig
      }
    },
    getScriptConfig: () => scriptConfig,
    setStyleConfig: (newConfig = {}) => {
      if (!newConfig || typeof newConfig !== 'object') {
        return
      }

      styleConfig = {
        ...styleConfig,
        ...newConfig
      }
    },
    getStyleConfig: () => styleConfig,
    addCss: (css) => {
      schema.css = `${schema.css}\n${css}`
    }
  }

  // 解析 template
  const templateStr = genTemplateByHook(schema, globalHooks, { ...parsedConfig, componentsMap: componentsMap })

  // 生成 script
  const scriptStr = genScriptByHook(schema, globalHooks, { ...parsedConfig, componentsMap: componentsMap })

  // 生成 style
  const styleStr = generateStyleTag(schema, styleConfig)

  return `${templateStr}\n${scriptStr}\n${styleStr}`
}

export const genSFCWithDefaultPlugin = (schema, componentsMap, config = {}) => {
  const { templateItemValidate = [], genTemplate = [], parseScript = [], genScript = {} } = config.hooks || {}
  const defaultComponentHooks = [handleComponentNameHook, handleTinyIcon]

  const defaultAttributeHook = [
    handleTinyGrid,
    handleConditionAttrHook,
    handleLoopAttrHook,
    handleSlotBindAttrHook,
    handleAttrKeyHook,
    handlePrimitiveAttributeHook,
    handleExpressionAttrHook,
    handleI18nAttrHook,
    handleTinyIconPropsHook,
    handleObjBindAttrHook,
    handleEventAttrHook
  ]

  const defaultChildrenHook = [handleExpressionChildren]
  const defaultTemplateItemValidateHook = [validEmptyTemplateHook]

  const defaultParseScriptHook = [
    addDefaultVueImport,
    addDefaultVueI18nImport,
    parsePropsHook,
    parseReactiveStateHook,
    handleProvideStatesContextHook,
    handleContextInjectHook
  ]

  const { GEN_IMPORT, GEN_PROPS, GEN_EMIT, GEN_STATE, GEN_METHOD, GEN_LIFECYCLE } = GEN_SCRIPT_HOOKS
  const defaultGenScriptHooks = {
    [GEN_IMPORT]: defaultGenImportHook,
    [GEN_PROPS]: defaultGenPropsHook,
    [GEN_EMIT]: defaultGenEmitsHook,
    [GEN_STATE]: defaultGenStateHook,
    [GEN_METHOD]: defaultGenMethodHook,
    [GEN_LIFECYCLE]: defaultGenLifecycleHook
  }

  const newConfig = {
    ...config,
    hooks: {
      templateItemValidate: [...templateItemValidate, ...defaultTemplateItemValidateHook],
      genTemplate: [...genTemplate, ...defaultComponentHooks, ...defaultAttributeHook, ...defaultChildrenHook],
      parseScript: [...parseScript, ...defaultParseScriptHook],
      genScript: {
        ...defaultGenScriptHooks,
        ...genScript
      }
    }
  }

  return generateSFCFile(schema, componentsMap, newConfig)
}

export default generateSFCFile
