import { INSERT_POSITION } from '@/constant'
import { getImportMap } from './parseImport'
import { genTemplateByHook, handleComponentNameHook, handleTinyGrid, handleTinyIcon } from './generateTemplate'
import { generateStyleTag } from './generateStyle'

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

  // 解析 import
  const { pkgMap, blockPkgMap } = getImportMap(schema, componentsMap, { blockRelativePath, blockSuffix })

  // 解析 state
  const state = schema.state || {}

  // 解析 method
  const methods = schema.methods || {}

  // 其他表达式语句
  const statements = {
    [INSERT_POSITION.AFTER_IMPORT]: [],
    [INSERT_POSITION.BEFORE_PROPS]: [],
    [INSERT_POSITION.AFTER_PROPS]: [],
    [INSERT_POSITION.BEFORE_STATE]: [],
    [INSERT_POSITION.AFTER_STATE]: [],
    [INSERT_POSITION.BEFORE_METHODS]: [],
    [INSERT_POSITION.AFTER_METHODS]: []
  }

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

      ;(statements[newStatement?.position] || statements[INSERT_POSITION.AFTER_METHODS]).push(newStatement?.value)

      return true
    },
    addMethod: (key, value) => {
      if (methods[key]) {
        return false
      }

      methods[key] = value

      return true
    },
    addState: (key, value) => {
      if (state[key]) {
        return false
      }

      state[key] = value

      return true
    },
    addImport: (fromPath, config) => {
      const dependenciesMap = pkgMap[fromPath] || blockPkgMap[fromPath]

      if (dependenciesMap) {
        // 默认导出
        if (!config.destructuring && dependenciesMap.find(({ destructuring }) => !destructuring)) {
          return false
        }

        dependenciesMap.push(config)

        return true
      }

      pkgMap[fromPath] = [config]

      return true
    },
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

  // TODO: 支持页面级别的 dataSource、utils

  // 解析 template
  const templateStr = genTemplateByHook(schema, globalHooks, parsedConfig)

  // 生成 script
  const scriptStr = ''

  // 生成 style
  const styleStr = generateStyleTag(schema, styleConfig)

  return `${templateStr}\n${scriptStr}\n${styleStr}`
}

export const genSFCWithDefaultPlugin = (schema, componentsMap, config = {}) => {
  // const hooks = config.hooks
  const { componentName = [], attribute = [], children = [] } = config.hooks || {}
  const defaultComponentHooks = [handleComponentNameHook, handleTinyIcon]

  const defaultAttributeHook = [handleTinyGrid]

  const defaultChildrenHook = []

  const newConfig = {
    ...config,
    hooks: {
      componentName: [...componentName, ...defaultComponentHooks],
      attribute: [...attribute, ...defaultAttributeHook],
      children: [...children, ...defaultChildrenHook]
    }
  }

  return generateSFCFile(schema, componentsMap, newConfig)
}

export default generateSFCFile
